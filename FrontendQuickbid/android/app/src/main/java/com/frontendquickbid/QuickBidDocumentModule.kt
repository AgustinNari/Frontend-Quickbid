package com.frontendquickbid

import android.content.ClipData
import android.content.Intent
import android.net.Uri
import android.webkit.MimeTypeMap
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID
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
  fun copyUriToPrivateDraftStorage(
    uriValue: String,
    suggestedName: String,
    promise: Promise,
  ) {
    executor.execute {
      var output: File? = null
      try {
        val sourceUri = Uri.parse(uriValue)
        if (sourceUri.scheme?.lowercase() !in setOf("content", "file")) {
          throw IllegalArgumentException("La URI de la foto no es compatible")
        }
        val contentType = detectContentType(sourceUri, suggestedName)
        val filename = draftFilename(suggestedName, contentType)
        val directory = draftDirectory().apply {
          if (!exists() && !mkdirs()) {
            throw IllegalStateException("No se pudo preparar el almacenamiento privado")
          }
        }
        val destinationFile = File(directory, "${UUID.randomUUID()}-$filename")
        output = destinationFile
        val input = when (sourceUri.scheme?.lowercase()) {
          "content" -> reactContext.contentResolver.openInputStream(sourceUri)
          "file" -> sourceUri.path?.let { File(it).inputStream() }
          else -> null
        } ?: throw IllegalArgumentException("No se pudo leer la foto seleccionada")

        var total = 0L
        input.use { source ->
          destinationFile.outputStream().use { destination ->
            val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
            while (true) {
              val read = source.read(buffer)
              if (read < 0) break
              total += read
              if (total > MAX_DRAFT_FILE_BYTES) {
                throw IllegalArgumentException("La foto supera el limite de 10 MB")
              }
              destination.write(buffer, 0, read)
            }
          }
        }
        if (total == 0L) throw IllegalArgumentException("La foto seleccionada esta vacia")

        promise.resolve(Arguments.createMap().apply {
          putString("uri", Uri.fromFile(destinationFile).toString())
          putString("name", filename)
          putString("type", contentType)
          putDouble("sizeBytes", total.toDouble())
        })
      } catch (error: Exception) {
        output?.delete()
        promise.reject(
          "PRIVATE_DRAFT_COPY_FAILED",
          error.message ?: "No se pudo guardar la foto en este dispositivo.",
          error,
        )
      }
    }
  }

  @ReactMethod
  fun deletePrivateDraftFile(uriValue: String, promise: Promise) {
    executor.execute {
      try {
        val uri = Uri.parse(uriValue)
        val candidate = if (uri.scheme?.lowercase() == "file") {
          uri.path?.let(::File)?.canonicalFile
        } else {
          null
        }
        val directory = draftDirectory().canonicalFile
        val isPrivateDraftFile = candidate != null &&
          candidate.parentFile?.canonicalFile == directory &&
          candidate.isFile
        promise.resolve(isPrivateDraftFile && candidate.delete())
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

  private fun draftDirectory() = File(reactContext.filesDir, "consignment_drafts")

  private fun detectContentType(uri: Uri, suggestedName: String): String {
    val resolverType = if (uri.scheme?.lowercase() == "content") {
      reactContext.contentResolver.getType(uri)?.substringBefore(';')
    } else {
      null
    }
    if (!resolverType.isNullOrBlank()) return resolverType
    val extension = suggestedName.substringAfterLast('.', "").lowercase()
    return MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension)
      ?: "image/jpeg"
  }

  private fun draftFilename(value: String, contentType: String): String {
    val cleaned = value.substringAfterLast('/').substringAfterLast('\\')
      .replace(Regex("[^A-Za-z0-9._-]"), "_")
      .trim('.', '_')
      .take(100)
    val base = if (cleaned.isBlank()) "draft-photo" else cleaned
    if (base.substringAfterLast('.', "").isNotBlank()) return base
    val extension = MimeTypeMap.getSingleton().getExtensionFromMimeType(contentType)
      ?.takeIf { it.matches(Regex("[A-Za-z0-9]+")) }
      ?: "jpg"
    return "$base.$extension"
  }

  companion object {
    private const val MAX_DRAFT_FILE_BYTES = 10L * 1024L * 1024L
  }
}
