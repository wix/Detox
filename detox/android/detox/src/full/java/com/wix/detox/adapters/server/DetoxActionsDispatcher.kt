package com.wix.detox.adapters.server

import android.os.Handler
import android.os.Looper
import android.util.Log
import java.util.concurrent.CountDownLatch

private const val LOG_TAG = "DetoxDispatcher"

class DetoxActionsDispatcher {
    private val primaryExec = ActionsExecutor("detox.primary")
    private val secondaryExec = ActionsExecutor("detox.secondary")

    fun associateActionHandler(type: String, actionHandler: DetoxActionHandler, isPrimary: Boolean = true) {
        val actionsExecutor = (if (isPrimary) primaryExec else secondaryExec)
        actionsExecutor.associateHandler(type, actionHandler)
    }

    fun dispatchAction(type: String, params: String, messageId: Long) {
        (primaryExec.executeAction(type, params, messageId) ||
            secondaryExec.executeAction(type, params, messageId))
                .let { handled ->
                    if (!handled) Log.w(LOG_TAG, "No handler found for action '$type'")
                }
    }

    fun teardown() {
        primaryExec.teardown()
        secondaryExec.teardown()
    }

    fun join() {
        primaryExec.join()
        secondaryExec.join()
    }
}

private class ActionsExecutor(name: String) {
    private val actionHandlers = mutableMapOf<String, DetoxActionHandler>()
    private val thread: Thread
    private lateinit var handler: Handler

    init {
        val latch = CountDownLatch(1)

        thread = Thread(Runnable {
            Looper.prepare()
            handler = Handler(Looper.myLooper()!!)
            latch.countDown()
            Looper.loop()
        }, name)
        thread.start()
        latch.await()
    }

    fun associateHandler(type: String, actionHandler: DetoxActionHandler) {
        actionHandlers[type] = actionHandler
    }

    fun executeAction(type: String, params: String, messageId: Long): Boolean {
        actionHandlers[type]?.let {
            handler.post {
                Log.i(LOG_TAG, "Handling action '$type' (ID #$messageId)...")
                it.handle(params, messageId)
                Log.i(LOG_TAG, "Done with action '$type'")
            }
            return true
        }
        return false
    }

    fun teardown() {
        actionHandlers.clear()
        handler.looper.quit()
    }

    fun join() {
        thread.join()
    }
}
