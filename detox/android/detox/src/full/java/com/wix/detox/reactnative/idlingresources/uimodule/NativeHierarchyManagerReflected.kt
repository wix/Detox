package com.wix.detox.reactnative.idlingresources.uimodule

import android.util.Log
import android.view.View
import com.facebook.react.uimanager.NativeViewHierarchyManager
import com.facebook.react.uimanager.UIViewOperationQueue
import com.wix.detox.common.DetoxLog.Companion.LOG_TAG
import org.joor.Reflect
import org.joor.ReflectException

private const val FIELD_NATIVE_HIERARCHY_MANAGER = "mNativeViewHierarchyManager"

class NativeHierarchyManagerReflected(uIViewOperationQueueInstance: UIViewOperationQueue) {
    private val reflected = Reflect.on(uIViewOperationQueueInstance)

    fun getViewClass(tag: Int): View? {
        return nativeViewHierarchyManager()?.resolveView(tag)
    }

    private fun nativeViewHierarchyManager(): NativeViewHierarchyManager? {
        return try {
            reflected.field(FIELD_NATIVE_HIERARCHY_MANAGER).get<NativeViewHierarchyManager>()
        } catch(e: ReflectException) {
            Log.e(LOG_TAG, "failed to get $FIELD_NATIVE_HIERARCHY_MANAGER ", e.cause)
            null
        }
    }
}
