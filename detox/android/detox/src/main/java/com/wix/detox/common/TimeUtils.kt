package com.wix.detox.common

import com.wix.detox.espresso.DetoxErrors.DetoxRuntimeException

fun <T> runWithinTimeFrame(maxTime: Long, message: String? = null, block: () -> T): T {
    val startTime = System.currentTimeMillis()
    return block().also {
        val actualTime = System.currentTimeMillis() - startTime
        if (actualTime >= maxTime) {
            throw DetoxRuntimeException(message ?: "Action failed to complete within the expected time-frame (${actualTime}ms)")
        }
    }
}
