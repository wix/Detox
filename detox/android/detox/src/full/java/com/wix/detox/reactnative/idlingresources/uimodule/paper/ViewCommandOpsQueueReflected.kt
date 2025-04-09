package com.wix.detox.reactnative.idlingresources.uimodule.paper

import android.util.Log
import com.facebook.react.uimanager.UIViewOperationQueue
import com.wix.detox.common.DetoxLog
import org.joor.Reflect
import org.joor.ReflectException

private const val FIELD_VIEW_COMMAND_OPERATIONS = "mViewCommandOperations"

class ViewCommandOpsQueueReflected(uiViewOperationQueueInstance: UIViewOperationQueue) {
    private val instance = Reflect.on(uiViewOperationQueueInstance)

    val size: Int?
        get() = viewCommandOperations()?.size

    fun firstCommandReflected() = DispatchCommandOperationReflected(firstCommand())

    private fun firstCommand() = viewCommandOperations()?.elementAt(0)
    private fun viewCommandOperations(): Collection<Any>? =
        try {
            instance.field(FIELD_VIEW_COMMAND_OPERATIONS).get<Collection<Any>>()
        } catch(e: ReflectException) {
            Log.e(DetoxLog.LOG_TAG, "could not get reflected field mViewCommandOperations ", e)
            null
        }
}
