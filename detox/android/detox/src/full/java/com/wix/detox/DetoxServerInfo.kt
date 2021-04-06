package com.wix.detox

import com.wix.detox.common.DetoxErrors

class DetoxServerInfo internal constructor(launchArgs: LaunchArgs = LaunchArgs()) {
    val serverUrl: String? = launchArgs.detoxServerUrl
    val sessionId: String? = launchArgs.detoxSessionId

    init {
        if (serverUrl == null || sessionId == null) {
            throw DetoxErrors.DetoxRuntimeException("Detox-server connection info is missing - breaking bad! url=$serverUrl, sessionId=$sessionId")
        }
    }

    override fun toString(): String {
        return "url=$serverUrl, sessionId=$sessionId"
    }
}
