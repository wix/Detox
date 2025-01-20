package com.wix.detox.reactnative.idlingresources.looper

import android.os.Looper
import android.util.Log
import com.facebook.react.bridge.ReactContext
import org.joor.Reflect
import org.joor.ReflectException


private const val LOG_TAG = "DetoxRNIdleRes"
private const val METHOD_GET_LOOPER = "getLooper"
private const val FIELD_NATIVE_MODULES_MSG_QUEUE = "mNativeModulesMessageQueueThread"
private const val FIELD_JS_MSG_QUEUE = "mJSMessageQueueThread"

internal class MQThreadsReflector(private val reactContext: ReactContext) {

    fun getJSMQueue(): MQThreadReflected? {
        return getQueue(FIELD_JS_MSG_QUEUE)
    }

    fun getNativeModulesQueue(): MQThreadReflected? {
        return getQueue(FIELD_NATIVE_MODULES_MSG_QUEUE)
    }

    private fun getQueue(queueName: String): MQThreadReflected? {
        try {
            val queue = Reflect.on(reactContext).field(queueName).get() as Any?
            return MQThreadReflected(queue, queueName)
        } catch (e: ReflectException) {
            Log.e(LOG_TAG, "Could not find queue: $queueName", e)
        }
        return null
    }
}

internal class MQThreadReflected(private val queue: Any?, private val queueName: String) {
    fun getLooper(): Looper? {
        try {
            if (queue != null) {
                return Reflect.on(queue).call(METHOD_GET_LOOPER).get()
            }
        } catch (e: ReflectException) {
            Log.e(LOG_TAG, "Could not find looper for queue: $queueName", e)
        }
        return null
    }
}
