package com.wix.detox.common

import android.os.Handler
import android.os.Looper
import java.util.concurrent.Callable
import java.util.concurrent.FutureTask

object UIThread {
    private val handler = Handler(Looper.getMainLooper())

    @JvmStatic
    fun post(runnable: Runnable) {
        handler.post(runnable)
    }

    @JvmStatic
    fun postSync(runnable: Runnable) =
        postSync(Callable<Any?> {
            runnable.run()
            null
        })

    @JvmStatic
    fun <T> postSync(callable: Callable<T>): T =
        FutureTask<T>(callable)
            .also {
                handler.post(it)
            }.get()

    @JvmStatic
    fun runSync(runnable: Runnable) {
        if (isOnUIThread()) {
            runnable.run()
        } else {
            postSync(runnable)
        }
    }

    @JvmStatic
    fun <T> runSync(callable: Callable<T>): T {
        if (isOnUIThread()) {
            return callable.call()
        }
        return postSync(callable)
    }

    @JvmStatic
    fun postFirst(runnable: Runnable) {
        handler.postAtFrontOfQueue(runnable)
    }

    @JvmStatic
    fun postFirstSync(runnable: Runnable) {
        postFirstSync(Callable<Any?> {
            runnable.run()
            null
        })
    }

    @JvmStatic
    fun <T> postFirstSync(callable: Callable<T>): T =
        FutureTask<T>(callable)
            .also {
                handler.postAtFrontOfQueue(it)
            }.get()

    private fun isOnUIThread() =
        (Looper.myLooper() == Looper.getMainLooper())
}
