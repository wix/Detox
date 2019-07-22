package com.wix.detox

import android.util.Log
import org.apache.commons.lang3.exception.ExceptionUtils

class DetoxCrashHandler(private val wsClient: WebSocketClient) {
    fun attach() {
        Thread.setDefaultUncaughtExceptionHandler { thread, exception ->
            Log.e(LOG_TAG, "Crash detected!!! thread=${thread.name} (${thread.id})")

            val crashInfo = mapOf("errorDetails" to "@Thread ${thread.name}(${thread.id}):\n${ExceptionUtils.getStackTrace(exception)}")
            wsClient.sendAction(APP_CRASH_ACTION_NAME, crashInfo, APP_CRASH_MESSAGE_ID)
        }
    }

    companion object {
        val LOG_TAG: String = DetoxCrashHandler::class.java.simpleName

        const val APP_CRASH_ACTION_NAME = "AppWillTerminateWithError"
        const val APP_CRASH_MESSAGE_ID = -10000L
    }
}
