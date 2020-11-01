package com.wix.detox.common.proxy

import android.util.Log
import java.util.*

data class CallInfo(var inTime: Long? = null, var outTime: Long? = null) {
    fun open(inTime: Long = System.currentTimeMillis()): CallInfo {
        this.inTime = inTime
        this.outTime = null
        return this
    }

    fun close(outTime: Long = System.currentTimeMillis()): CallInfo {
        this.outTime = outTime
        return this
    }

    operator fun minus(other: CallInfo): Long? {
        val inTime = other.inTime
        val outTime = this.outTime
        if (outTime != null && inTime != null) {
            return outTime - inTime
        }
        return null
    }

    override fun toString() = "$inTime -> $outTime"
}

open class MethodsSpy(private val entityName: String) {
    private val methodHistories = mutableMapOf<String, LinkedList<CallInfo>>()
    private var enabled = false

    fun start() {
        reset()
        enabled = true
    }

    fun stop() {
        enabled = false
    }

    fun onBeforeCall(methodName: String) {
        if (enabled) {
            historyOf(methodName).addFirst(CallInfo().open())
        }
    }

    fun onAfterCall(methodName: String) {
        if (enabled) {
            historyOf(methodName).peekFirst()?.close()
        }
    }

    fun getHistory(methodName: String): Queue<CallInfo>?
        = methodHistories[methodName]

    fun dumpToLog() {
        for ((methodName, history) in methodHistories.entries) {
            Log.d(LOG_TAG, "[$entityName] method $methodName: $history")
        }
    }

    internal fun historyOf(key: String) =
        methodHistories.getOrPut(key) {
            LinkedList()
        }

    private fun reset() {
        methodHistories.clear()
    }

    companion object {
        private const val LOG_TAG = "MethodsSpy"
    }
}
