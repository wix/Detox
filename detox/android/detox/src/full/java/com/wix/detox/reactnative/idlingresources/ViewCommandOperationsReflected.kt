package com.wix.detox.reactnative.idlingresources

import android.util.Log
import com.facebook.react.uimanager.UIViewOperationQueue
import com.wix.detox.common.DetoxLog.Companion.LOG_TAG
import org.joor.Reflect
import java.lang.ref.WeakReference

private const val FIELD_VIEW_COMMAND_OPERATIONS = "mViewCommandOperations"
private const val FIELD_TAG = "mTag"
private const val FIELD_NUM_RETRIES = "numRetries"
private const val FIELD_COMMAND = "mCommand"

class ViewCommandOperationsReflected(uIViewOperationQueueInstance: UIViewOperationQueue) {
    private val reflectedInstance = Reflect.on(uIViewOperationQueueInstance)

    fun getSize(): Int {
        val viewCommandOperations = viewCommandOperations()
        return viewCommandOperations?.size ?: 0
    }
    fun getTag(): Int {
        return try {
            Reflect.on(firstElement()).field(FIELD_TAG).get<Int>()
        } catch (e: Exception) {
            Log.e(LOG_TAG, "failed to get $FIELD_TAG ", e.cause)
            0
        }
    }
    fun getNumRetries(): Int {
        return try {
            Reflect.on(firstElement()).field(FIELD_NUM_RETRIES).get<Int>()
        } catch (e: Exception) {
            Log.e(LOG_TAG, "failed to get $FIELD_NUM_RETRIES ", e.cause)
            0
        }
    }
    fun getViewCommand(): String {
        return try {
            Reflect.on(firstElement()).field(FIELD_COMMAND).get<String>()
        } catch (e: Exception) {
            Log.e(LOG_TAG, "failed to get $FIELD_COMMAND ", e.cause)
            ""
        }
    }
    fun weakRefFirstElement() = WeakReference(firstElement())
    private fun firstElement() = viewCommandOperations()?.elementAt(0)

    private fun viewCommandOperations(): Collection<Any>? {
        return try {
            reflectedInstance.field(FIELD_VIEW_COMMAND_OPERATIONS).get<Collection<Any>>()
        } catch(e: Exception) {
            Log.e(LOG_TAG, "could not get reflected field mViewCommandOperations ", e.cause)
            null
        }
    }
}
