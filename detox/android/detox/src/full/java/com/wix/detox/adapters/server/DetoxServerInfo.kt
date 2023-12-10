package com.wix.detox.adapters.server

import android.util.Log
import androidx.test.platform.app.InstrumentationRegistry
import com.wix.detox.LaunchArgs
import com.wix.detox.common.DetoxLog

private const val DEFAULT_URL = "ws://localhost:8099"

class DetoxServerInfo internal constructor(launchArgs: LaunchArgs = LaunchArgs()) {
    val serverUrl: String = launchArgs.detoxServerUrl ?: DEFAULT_URL
    val sessionId: String = launchArgs.detoxSessionId ?: InstrumentationRegistry.getInstrumentation().targetContext.applicationInfo.packageName

    init {
        Log.i(DetoxLog.LOG_TAG, "Detox server connection details: url=$serverUrl, sessionId=$sessionId")
    }
}
