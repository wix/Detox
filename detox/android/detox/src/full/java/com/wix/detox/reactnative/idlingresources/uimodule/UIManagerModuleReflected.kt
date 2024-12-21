package com.wix.detox.reactnative.idlingresources.uimodule

import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.UIViewOperationQueue
import com.wix.detox.common.DetoxLog.Companion.LOG_TAG
import org.joor.Reflect

private const val CLASS_UI_MANAGER_MODULE = "com.facebook.react.uimanager.UIManagerModule"
private const val METHOD_GET_NATIVE_MODULE = "getNativeModule"
private const val METHOD_GET_UI_IMPLEMENTATION = "getUIImplementation"
private const val METHOD_IS_EMPTY = "isEmpty"
private const val FIELD_UI_OPERATION_QUEUE = "mOperationsQueue"
private const val FIELD_DISPATCH_RUNNABLES = "mDispatchUIRunnables"
private const val FIELD_DISPATCH_RUNNABLES_LOCK = "mDispatchRunnablesLock"
private const val FIELD_NON_BATCHED_OPS = "mNonBatchedOperations"
private const val FIELD_NON_BATCHED_OPS_LOCK = "mNonBatchedOperationsLock"

class UIManagerModuleReflected(private val reactContext: ReactContext) {

    fun isRunnablesListEmpty(): Boolean =
        getUIOperationQueue()?.let {
            synchronized(Reflect.on(it).field(FIELD_DISPATCH_RUNNABLES_LOCK).get()) {
                Reflect.on(it)
                    .field(FIELD_DISPATCH_RUNNABLES)
                    .call(METHOD_IS_EMPTY).get()
            }
        } ?: true

    fun isNonBatchOpsEmpty(): Boolean =
        getUIOperationQueue()?.let {
            synchronized(Reflect.on(it).field(FIELD_NON_BATCHED_OPS_LOCK).get()) {
                Reflect.on(it)
                    .field(FIELD_NON_BATCHED_OPS)
                    .call(METHOD_IS_EMPTY).get()
            }
        } ?: true

    fun isOperationQueueEmpty(): Boolean =
        getUIOperationQueue()?.let {
            Reflect.on(it).call(METHOD_IS_EMPTY).get()
        } ?: true

    private fun viewCommandOperations(): ViewCommandOpsQueueReflected? =
        getUIOperationQueue()?.let {
            ViewCommandOpsQueueReflected(it)
        }


    private fun getUIOperationQueue(): UIViewOperationQueue? =
        try {
            val uiModuleClass = Class.forName(CLASS_UI_MANAGER_MODULE)
            Reflect.on(reactContext)
                .call(METHOD_GET_NATIVE_MODULE, uiModuleClass)
                .call(METHOD_GET_UI_IMPLEMENTATION)
                .field(FIELD_UI_OPERATION_QUEUE)
                .get()
        } catch (e: Exception) {
            Log.e(LOG_TAG, "failed to get $CLASS_UI_MANAGER_MODULE instance ", e)
            null
        }
}
