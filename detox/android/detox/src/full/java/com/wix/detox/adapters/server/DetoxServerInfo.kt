package com.wix.detox.adapters.server

import androidx.test.platform.app.InstrumentationRegistry
import com.wix.detox.LaunchArgs

private const val DEFAULT_URL = "ws://localhost:8099"

class DetoxServerInfo internal constructor(launchArgs: LaunchArgs = LaunchArgs()) {
    val serverUrl: String = launchArgs.detoxServerUrl ?: DEFAULT_URL
    val sessionId: String = launchArgs.detoxSessionId ?: InstrumentationRegistry.getInstrumentation().targetContext.applicationInfo.packageName

    override fun toString(): String {
        return "url=$serverUrl, sessionId=$sessionId"
    }
}
