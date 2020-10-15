package com.wix.detox.common.proxy

import android.os.SystemClock
import android.util.Log

data class CallTimes(var inTime: Long? = null, var outTime: Long? = null) {
    fun open(inTime: Long = SystemClock.uptimeMillis()) {
        this.inTime = inTime
        this.outTime = null
    }

    fun close(outTime: Long = SystemClock.uptimeMillis()) {
        this.outTime = outTime
    }
}

class CallJournal {
    private val callTimesMap: Map<String, CallTimes> = mutableMapOf()

    fun onBeforeCall(methodName: String) {
        Log.d("DBGDBG", "before method $methodName")
        valueOf(methodName).open()
    }

    fun onAfterCall(methodName: String) {
        Log.d("DBGDBG", "after method $methodName")
        callTimesMap[methodName]?.close()
    }

    private fun valueOf(key: String): CallTimes =
            callTimesMap.getOrElse(key) {
                CallTimes()
            }
}
