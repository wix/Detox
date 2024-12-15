package com.wix.detox.reactnative.idlingresources.uimodule

import android.os.Debug
import android.util.Log
import android.view.Choreographer
import androidx.test.espresso.IdlingResource.ResourceCallback
import com.facebook.react.bridge.ReactContext
import com.wix.detox.reactnative.helpers.RNHelpers
import com.wix.detox.reactnative.idlingresources.DetoxBaseIdlingResource
import org.joor.ReflectException
import java.lang.reflect.Field

/**
 * Espresso IdlingResource for React Native's UI Module.
 * Hooks up to React Native internals to grab the pending ui operations from it.
 */
class UIModuleIdlingResource(private val reactContext: ReactContext)
    : DetoxBaseIdlingResource(), Choreographer.FrameCallback {

    private val rn66workaround = RN66Workaround()
    private val uiManagerModuleReflected = UIManagerModuleReflected(reactContext)
    private var callback: ResourceCallback? = null

    override fun getName(): String = UIModuleIdlingResource::class.java.name
    override fun getDebugName(): String = " ui"
    override fun getBusyHint(): Map<String, Any> {
        return mapOf("reason" to "UI rendering activity")
    }

    override fun checkIdle(): Boolean {
        try {

            Debug.waitForDebugger()

            if (!reactContext.hasActiveReactInstance()) {
                Log.e(LOG_TAG, "No active CatalystInstance. Should never see this.")
                return false
            }

            if (getSurfaceIdToManagerCount(reactContext) == getMountedSurfaceIdsCount(reactContext)) {
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


    fun getMountedSurfaceIdsCount(reactContext: ReactContext): Int {
        try {
            val mFabricUIManager = getFabricManager(reactContext) ?: return -1

            // Accessing the mMountedSurfaceIds field
            val mMountedSurfaceIdsField: Field = mFabricUIManager::class.java.getDeclaredField("mMountedSurfaceIds")
            mMountedSurfaceIdsField.isAccessible = true
            val mMountedSurfaceIds = mMountedSurfaceIdsField.get(mFabricUIManager)

            // Ensure it's an ArrayList and get the size
            if (mMountedSurfaceIds is ArrayList<*>) {
                return mMountedSurfaceIds.size
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return -1 // Return -1 if the operation fails
    }

    fun getSurfaceIdToManagerCount(reactContext: Any): Int {
        try {
            val mFabricUIManager = getFabricManager(reactContext) ?: return -1

            // Accessing the mMountingManager field
            val mMountingManagerField: Field = mFabricUIManager::class.java.getDeclaredField("mMountingManager")
            mMountingManagerField.isAccessible = true
            val mMountingManager = mMountingManagerField.get(mFabricUIManager)

            // Accessing the mSurfaceIdToManager field
            val mSurfaceIdToManagerField: Field = mMountingManager::class.java.getDeclaredField("mSurfaceIdToManager")
            mSurfaceIdToManagerField.isAccessible = true
            val mSurfaceIdToManager = mSurfaceIdToManagerField.get(mMountingManager)

            // Ensure it's a Map and get the size
            if (mSurfaceIdToManager is Map<*, *>) {
                return mSurfaceIdToManager.size
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return -1 // Return -1 if the operation fails
    }

    private fun getFabricManager(reactContext: Any): Any? {
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
        return mFabricUIManager
    }

    companion object {
        private const val LOG_TAG = "Detox"
    }
}
