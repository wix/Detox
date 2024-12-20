package com.wix.detox.reactnative.idlingresources.uimodule

import android.util.Log
import android.view.Choreographer
import androidx.test.espresso.IdlingResource.ResourceCallback
import com.facebook.react.bridge.ReactContext
import com.wix.detox.reactnative.idlingresources.DetoxBaseIdlingResource
import org.joor.ReflectException
import java.lang.reflect.Field
import java.util.concurrent.ConcurrentLinkedQueue

/**
 * Espresso IdlingResource for React Native's UI Module.
 * Hooks up to React Native internals to grab the pending ui operations from it.
 */
class UIModuleIdlingResource(private val reactContext: ReactContext)
    : DetoxBaseIdlingResource(), Choreographer.FrameCallback {

    private val uiManagerModuleReflected = UIManagerModuleReflected(reactContext)
    private var callback: ResourceCallback? = null

    override fun getName(): String = UIModuleIdlingResource::class.java.name
    override fun getDebugName(): String = " ui"
    override fun getBusyHint(): Map<String, Any> {
        return mapOf("reason" to "UI rendering activity")
    }

    override fun checkIdle(): Boolean {
        try {

            if (!reactContext.hasActiveReactInstance()) {
                Log.e(LOG_TAG, "No active CatalystInstance. Should never see this.")
                return false
            }

            if (getMountItemsSize() == 0 && getViewCommandMountItemsSize() == 0) {
                Log.i(LOG_TAG, "UIManagerModule is idle")
                notifyIdle()
                return true

            }

            Log.i(LOG_TAG, "UIManagerModule is busy")
            Choreographer.getInstance().postFrameCallback(this)
            return false
        } catch (e: ReflectException) {
            Log.e(LOG_TAG, "Can't set up RN UIModule listener", e.cause)
        }
        notifyIdle()
        return true
    }

    override fun registerIdleTransitionCallback(callback: ResourceCallback) {
        this.callback = callback
        Choreographer.getInstance().postFrameCallback(this)
    }

    override fun doFrame(frameTimeNanos: Long) {
        isIdleNow
    }

    override fun notifyIdle() {
        callback?.run {
            onTransitionToIdle()
        }
    }

    private fun getViewCommandMountItemsSize(): Int {
        try {
            val fabricUIManager = getFabricManager(reactContext)
            val mMountItemDispatcher = getMountItemDispatcher(fabricUIManager)

            // Access mMountItems field from MountItemDispatcher
            val mViewCommandMountItemsField: Field = mMountItemDispatcher::class.java.getDeclaredField("mViewCommandMountItems")
            mViewCommandMountItemsField.isAccessible = true
            val mViewCommandMountItems = mViewCommandMountItemsField.get(mMountItemDispatcher)

            // Ensure it's a ConcurrentLinkedQueue and return the size
            if (mViewCommandMountItems is ConcurrentLinkedQueue<*>) {
                return mViewCommandMountItems.size
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return -1 // Return -1 if reflection fails
    }

    private fun getMountItemsSize(): Int {
        try {
            val fabricUIManager = getFabricManager(reactContext)
            val mMountItemDispatcher = getMountItemDispatcher(fabricUIManager)

            // Access mMountItems field from MountItemDispatcher
            val mMountItemsField: Field = mMountItemDispatcher::class.java.getDeclaredField("mMountItems")
            mMountItemsField.isAccessible = true
            val mMountItems = mMountItemsField.get(mMountItemDispatcher)

            // Ensure it's a ConcurrentLinkedQueue and return the size
            if (mMountItems is ConcurrentLinkedQueue<*>) {
                return mMountItems.size
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return -1 // Return -1 if reflection fails
    }

    private fun getMountItemDispatcher(fabricUIManager: Any): Any {
        // Access mMountItemDispatcher from FabricUIManager
        val mMountItemDispatcherField: Field =
            fabricUIManager::class.java.getDeclaredField("mMountItemDispatcher")
        mMountItemDispatcherField.isAccessible = true
        val mMountItemDispatcher = mMountItemDispatcherField.get(fabricUIManager)
        return mMountItemDispatcher!!
    }


    private fun getFabricManager(reactContext: Any): Any {
        // Accessing the mReactHost field
        val mReactHostField: Field = reactContext::class.java.getDeclaredField("mReactHost")
        mReactHostField.isAccessible = true
        val mReactHost = mReactHostField.get(reactContext)

        // Accessing the mReactInstance field
        val mReactInstanceField: Field = mReactHost::class.java.getDeclaredField("mReactInstance")
        mReactInstanceField.isAccessible = true
        val mReactInstance = mReactInstanceField.get(mReactHost)

        // Accessing the mFabricUIManager field
        val mFabricUIManagerField: Field = mReactInstance::class.java.getDeclaredField("mFabricUIManager")
        mFabricUIManagerField.isAccessible = true
        val mFabricUIManager = mFabricUIManagerField.get(mReactInstance)
        return mFabricUIManager!!
    }

    companion object {
        private const val LOG_TAG = "Detox"
    }
}
