package com.wix.detox.reactnative.idlingresources.uimodule.fabric

import android.os.SystemClock
import android.view.Choreographer
import androidx.test.espresso.IdlingResource
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.wix.detox.reactnative.ReactNativeInfo
import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource
import org.joor.Reflect
import java.util.concurrent.ConcurrentLinkedQueue


class FabricUIManagerIdlingResources(
    private val reactContext: ReactContext
) : DetoxIdlingResource(), Choreographer.FrameCallback {

    private var firstBusyTimestamp: Long = 0
    private var isSteadyState: Boolean = false

    override fun checkIdle(): Boolean {
        val mountItemsCount = getMountItemsSize()
        val viewCommandMountItemsCount = getViewCommandMountItemsSize()

        if (mountItemsCount == 0 && viewCommandMountItemsCount == 0) {
            firstBusyTimestamp = 0
            isSteadyState = false
            notifyIdle()
            return true
        }

        // Once we've determined this is a steady-state (a stuck mount item that never
        // resolves), keep reporting idle as long as the count stays low.
        if (isSteadyState && mountItemsCount <= 1 && viewCommandMountItemsCount == 0) {
            notifyIdle()
            return true
        }

        // Count increased beyond steady-state threshold — reset and treat as genuinely busy.
        if (isSteadyState) {
            isSteadyState = false
            firstBusyTimestamp = 0
        }

        val now = SystemClock.uptimeMillis()
        if (firstBusyTimestamp == 0L) {
            firstBusyTimestamp = now
        }

        // On API 36+, edge-to-edge enforcement can cause a single mount item to remain
        // permanently in the queue on older RN versions. If the count stays at 1 for over
        // 1.5s, treat it as a steady-state condition rather than a genuinely busy UI.
        if (now - firstBusyTimestamp >= BUSY_TOLERANCE_MS
            && mountItemsCount <= 1
            && viewCommandMountItemsCount == 0) {
            isSteadyState = true
            notifyIdle()
            return true
        }

        Choreographer.getInstance().postFrameCallback(this)
        return false
    }

    override fun registerIdleTransitionCallback(callback: IdlingResource.ResourceCallback?) {
        super.registerIdleTransitionCallback(callback)
        Choreographer.getInstance().postFrameCallback(this)
    }

    override fun onUnregistered() {
        super.onUnregistered()
        Choreographer.getInstance().removeFrameCallback(this)
    }

    override fun getDebugName(): String {
        return "ui"
    }

    override fun getBusyHint(): Map<String, Any> {
        return mapOf("mount_items" to getMountItemsSize(), "view_command_mount_items" to getViewCommandMountItemsSize())
    }

    override fun getName(): String = FabricUIManagerIdlingResources::class.java.name

    override fun doFrame(frameTimeNanos: Long) {
        isIdleNow()
    }

    private fun getMountItemsSize(): Int {
        val mountItemDispatcher = getMountItemDispatcher()
        val filedName = if (ReactNativeInfo.rnVersion().minor >= 81) {
            "mountItems"
        } else {
            "mMountItems"
        }
        val mountItems = Reflect.on(mountItemDispatcher).field(filedName).get<ConcurrentLinkedQueue<*>>()
        return mountItems.size
    }

    private fun getMountItemDispatcher(): Any {
        val fabricUIManager = UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC)
        val mountItemDispatcher = Reflect.on(fabricUIManager).field("mMountItemDispatcher").get<Any>()
        return mountItemDispatcher
    }

    private fun getViewCommandMountItemsSize(): Int {
        val mountItemDispatcher = getMountItemDispatcher()
        val filedName = if (ReactNativeInfo.rnVersion().minor >= 81) {
            "viewCommandMountItems"
        } else {
            "mViewCommandMountItems"
        }
        val viewCommandMountItems =
            Reflect.on(mountItemDispatcher).field(filedName).get<ConcurrentLinkedQueue<*>>()
        return viewCommandMountItems.size
    }

    companion object {
        private const val BUSY_TOLERANCE_MS = 1500L
    }
}
