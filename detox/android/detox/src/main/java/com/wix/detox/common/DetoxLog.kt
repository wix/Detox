@file:JvmName("DetoxLog")

package com.wix.detox.common

import android.util.Log

class DetoxLog private constructor() {

    fun verbose(tag: String, log: String) = Log.v(tag, log)
    fun verbose(tag: String, log: String, error: Throwable) = Log.v(tag, log, error)

    fun debug(tag: String, log: String) = Log.d(tag, log)
    fun debug(tag: String, log: String, error: Throwable) = Log.d(tag, log, error)

    fun info(tag: String, log: String) = Log.i(tag, log)
    fun info(tag: String, log: String, error: Throwable) = Log.i(tag, log, error)

    fun warn(tag: String, log: String) = Log.w(tag, log)
    fun warn(tag: String, log: String, error: Throwable) = Log.w(tag, log, error)
    fun warn(tag: String, error: Throwable) = Log.w(tag, error)

    fun error(tag: String, log: String) = Log.e(tag, log)
    fun error(tag: String, log: String, error: Throwable) = Log.e(tag, log, error)

    internal companion object {
        internal val instance = DetoxLog()
        internal const val LOG_TAG = "Detox"
    }
}
