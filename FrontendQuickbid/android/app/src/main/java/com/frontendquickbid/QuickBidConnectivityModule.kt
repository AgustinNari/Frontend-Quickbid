package com.frontendquickbid

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class QuickBidConnectivityModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  private val connectivity =
    reactContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
  private var registered = false

  private val callback = object : ConnectivityManager.NetworkCallback() {
    override fun onAvailable(network: Network) = emitState()
    override fun onLost(network: Network) = emitState()
    override fun onCapabilitiesChanged(network: Network, capabilities: NetworkCapabilities) = emitState()
  }

  override fun getName() = "QuickBidConnectivity"

  override fun initialize() {
    super.initialize()
    if (!registered) {
      connectivity.registerDefaultNetworkCallback(callback)
      registered = true
    }
  }

  override fun invalidate() {
    if (registered) {
      runCatching { connectivity.unregisterNetworkCallback(callback) }
      registered = false
    }
    super.invalidate()
  }

  @ReactMethod
  fun getCurrentState(promise: Promise) {
    promise.resolve(currentState())
  }

  @ReactMethod fun addListener(eventName: String) = Unit
  @ReactMethod fun removeListeners(count: Int) = Unit

  private fun emitState() {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("QuickBidNetworkChanged", currentState())
  }

  private fun currentState() = Arguments.createMap().apply {
    val network = connectivity.activeNetwork
    val capabilities = network?.let(connectivity::getNetworkCapabilities)
    val hasInternet = capabilities?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
    val validated = capabilities?.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) == true
    putBoolean("isConnected", network != null && hasInternet)
    putBoolean("isInternetReachable", network != null && hasInternet && validated)
    putString("type", connectionType(capabilities))
  }

  private fun connectionType(capabilities: NetworkCapabilities?): String = when {
    capabilities == null -> "none"
    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "wifi"
    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "cellular"
    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "ethernet"
    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN) -> "vpn"
    else -> "unknown"
  }
}
