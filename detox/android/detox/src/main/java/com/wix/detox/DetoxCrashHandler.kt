package com.wix.detox

import android.util.Log

class DetoxCrashHandler(private val wsClient: WebSocketClient) {
    fun attach() {
        Thread.setDefaultUncaughtExceptionHandler { thread, exception ->
            Log.e(LOG_TAG, "Crash detected!!! thread=${thread.name} (${thread.id})")

            val crashInfo = mapOf("errorDetails" to "@Thread ${thread.name}(${thread.id}):\n${Log.getStackTraceString(exception)}\nCheck device logs for full details!")
            wsClient.sendAction(ACTION_NAME, crashInfo, MESSAGE_ID)
        }
    }

    companion object {
        val LOG_TAG: String = DetoxCrashHandler::class.java.simpleName

        private const val ACTION_NAME = "AppWillTerminateWithError"
        private const val MESSAGE_ID = -10000L
    }
}
