package com.wix.detox.reactnative.idlingresources

import android.util.Log
import android.view.View
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.UIViewOperationQueue
import com.wix.detox.common.DetoxLog.Companion.LOG_TAG
import org.joor.Reflect
import java.lang.ref.WeakReference

private const val CLASS_UI_MANAGER_MODULE = "com.facebook.react.uimanager.UIManagerModule"
private const val METHOD_GET_NATIVE_MODULE = "getNativeModule"
private const val METHOD_GET_UI_IMPLEMENTATION = "getUIImplementation"
private const val FIELD_UI_OPERATION_QUEUE = "mOperationsQueue"
private const val LOCK_RUNNABLES = "mDispatchRunnablesLock"
private const val FIELD_DISPATCH_RUNNABLES = "mDispatchUIRunnables"
private const val METHOD_IS_EMPTY = "isEmpty"
private const val LOCK_OPERATIONS = "mNonBatchedOperationsLock"


class UIManagerModuleReflected(private val reactContext: ReactContext) {
    fun getWeakRefFirstElement(): WeakReference<Any?>? {
        return viewCommandOperations()?.weakRefFirstElement()
    }
    fun getViewCommandOperationsSize(): Int {
        val viewCommandOperations = viewCommandOperations()
        return viewCommandOperations?.getSize() ?: 0
    }
    fun getViewClass(): View? {
        val viewCommandOperations = viewCommandOperations()
        val nativeViewHierarchyManager = nativeViewHierarchyManager()
        val tag = viewCommandOperations?.getTag() ?: 0
        return if (nativeViewHierarchyManager != null && tag != 0)
            nativeViewHierarchyManager.getViewClass(tag) else null
    }
    fun getNumRetries(): Int {
        val viewCommandOperations = viewCommandOperations()
        return viewCommandOperations?.getNumRetries() ?: 0
    }
    fun getViewCommand(): String {
        val viewCommandOperations = viewCommandOperations()
        return viewCommandOperations?.getViewCommand() ?: ""
    }
    fun getInstance(): UIViewOperationQueue? {
        return try {
            val uiModuleClass = Class.forName(CLASS_UI_MANAGER_MODULE)
            Reflect.on(reactContext)
                .call(METHOD_GET_NATIVE_MODULE, uiModuleClass)
                .call(METHOD_GET_UI_IMPLEMENTATION)
                .field(FIELD_UI_OPERATION_QUEUE)
                .get()
        } catch (e: Exception) {
            Log.e(LOG_TAG, "failed to get $CLASS_UI_MANAGER_MODULE instance ", e.cause)
            null
        }
    }

    fun getRunnablesAreEmpty(): Boolean {
        val uiViewOperationQueueInstance = getInstance()
        return if (uiViewOperationQueueInstance == null) true else {
            synchronized(Reflect.on(uiViewOperationQueueInstance).field(LOCK_RUNNABLES).get())
            {
                Reflect.on(uiViewOperationQueueInstance)
                    .field(FIELD_DISPATCH_RUNNABLES)
                    .call(METHOD_IS_EMPTY).get<Boolean>()
            }
        }
    }

    fun getNonBatchOpsEmpty(): Boolean {
        val uiViewOperationQueueInstance = getInstance()
        return if (uiViewOperationQueueInstance == null) true else {
            synchronized(Reflect.on(uiViewOperationQueueInstance).field(LOCK_OPERATIONS).get())
            {
                Reflect.on(uiViewOperationQueueInstance)
                    .field(FIELD_DISPATCH_RUNNABLES)
                    .call(METHOD_IS_EMPTY).get<Boolean>()
            }
        }
    }

    fun getOperationQueueEmpty(): Boolean {
        val uiViewOperationQueueInstance = getInstance()
        return if (uiViewOperationQueueInstance == null) true else {
            Reflect.on(uiViewOperationQueueInstance)
                .call(METHOD_IS_EMPTY).get<Boolean>()
        }
    }

    private fun viewCommandOperations(): ViewCommandOperationsReflected? {
        val uiViewOperationQueueInstance = getInstance()
        return if (uiViewOperationQueueInstance == null) null else ViewCommandOperationsReflected(uiViewOperationQueueInstance)
    }
    private fun nativeViewHierarchyManager(): NativeHierarchyManagerReflected? {
        val uiViewOperationQueueInstance = getInstance()
        return if (uiViewOperationQueueInstance == null) null else NativeHierarchyManagerReflected(uiViewOperationQueueInstance)
    }
}
