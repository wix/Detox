package com.wix.detox

import android.util.Log
import com.github.anrwatchdog.ANRWatchDog

class DetoxANRHandler(private val wsClient: WebSocketClient) {
    fun attach() {
        ANRWatchDog().setReportMainThreadOnly().setANRListener {
            val info = mapOf("threadDump" to Log.getStackTraceString(it))
            wsClient.sendAction(ACTION_NAME, info, MESSAGE_ID)
        }.start()

        ANRWatchDog().setANRListener {
            Log.e(LOG_TAG, "App nonresnponsive detection!", it)
        }.start()
    }

    companion object {
        private val LOG_TAG: String = DetoxANRHandler::class.java.simpleName

        private const val ACTION_NAME = "AppNonresponsiveDetected"
        private const val MESSAGE_ID = -10001L
    }
}
