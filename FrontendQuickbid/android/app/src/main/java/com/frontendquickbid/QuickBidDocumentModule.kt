package com.frontendquickbid

import android.content.ClipData
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

class QuickBidDocumentModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  private val executor = Executors.newSingleThreadExecutor()

  override fun getName() = "QuickBidDocument"

  override fun invalidate() {
    executor.shutdownNow()
    super.invalidate()
  }

  @ReactMethod
  fun canReadUri(uriValue: String, promise: Promise) {
    executor.execute {
      try {
        val uri = Uri.parse(uriValue)
        val readable = when (uri.scheme?.lowercase()) {
          "content" -> reactContext.contentResolver.openInputStream(uri)?.use { true } ?: false
          "file" -> uri.path?.let { File(it).isFile && File(it).canRead() } ?: false
          null, "" -> File(uriValue).isFile && File(uriValue).canRead()
          else -> false
        }
        promise.resolve(readable)
      } catch (_: Exception) {
        promise.resolve(false)
      }
    }
  }

  @ReactMethod
  fun downloadAndShare(
    url: String,
    authorization: String,
    fallbackFilename: String?,
    promise: Promise,
  ) {
    executor.execute {
      try {
        if (!url.startsWith("https://") && !url.startsWith("http://")) {
          throw IllegalArgumentException("URL de documento invalida")
        }
        if (Regex("[?&](access_)?token=", RegexOption.IGNORE_CASE).containsMatchIn(url)) {
          throw IllegalArgumentException("No se permiten tokens en la URL")
        }
        val connection = URL(url).openConnection() as HttpURLConnection
        connection.requestMethod = "GET"
        connection.instanceFollowRedirects = false
        connection.connectTimeout = 20_000
        connection.readTimeout = 20_000
        connection.setRequestProperty("Accept", "application/pdf, application/octet-stream")
        if (authorization.startsWith("Bearer ")) {
          connection.setRequestProperty("Authorization", authorization)
        }
        val status = connection.responseCode
        if (status !in 200..299) {
          connection.disconnect()
          promise.reject("HTTP_$status", "No se pudo descargar el documento.")
          return@execute
        }
        val contentType = connection.contentType?.substringBefore(';') ?: "application/pdf"
        val filename = safeFilename(
          filenameFromDisposition(connection.getHeaderField("Content-Disposition"))
            ?: fallbackFilename
            ?: "documento-quickbid.pdf",
        )
        val directory = File(reactContext.cacheDir, "shared_documents").apply { mkdirs() }
        val output = File(directory, filename)
        var total = 0L
        connection.inputStream.use { input ->
          output.outputStream().use { stream ->
            val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
            while (true) {
              val read = input.read(buffer)
              if (read < 0) break
              stream.write(buffer, 0, read)
              total += read
            }
          }
        }
        connection.disconnect()
        if (total == 0L) throw IllegalStateException("El documento recibido esta vacio")

        val uri = FileProvider.getUriForFile(
          reactContext,
          "${reactContext.packageName}.fileprovider",
          output,
        )
        val sendIntent = Intent(Intent.ACTION_SEND).apply {
          type = contentType
          putExtra(Intent.EXTRA_STREAM, uri)
          clipData = ClipData.newRawUri(filename, uri)
          addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        val chooser = Intent.createChooser(sendIntent, "Abrir o compartir documento").apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactContext.startActivity(chooser)

        promise.resolve(Arguments.createMap().apply {
          putString("filename", filename)
          putString("contentType", contentType)
          putDouble("sizeBytes", total.toDouble())
          putBoolean("shared", true)
        })
      } catch (error: Exception) {
        promise.reject("DOCUMENT_SHARE_FAILED", "No pudimos abrir o compartir el documento.", error)
      }
    }
  }

  private fun filenameFromDisposition(value: String?): String? {
    if (value.isNullOrBlank()) return null
    val encoded = Regex("filename\\*=UTF-8''([^;]+)", RegexOption.IGNORE_CASE).find(value)?.groupValues?.get(1)
    if (encoded != null) return java.net.URLDecoder.decode(encoded, "UTF-8")
    return Regex("filename=\\\"?([^\\\";]+)", RegexOption.IGNORE_CASE).find(value)?.groupValues?.get(1)
  }

  private fun safeFilename(value: String): String {
    val cleaned = value.substringAfterLast('/').substringAfterLast('\\')
      .replace(Regex("[^A-Za-z0-9._-]"), "_")
      .take(120)
    return if (cleaned.isBlank()) "documento-quickbid.pdf" else cleaned
  }
}
