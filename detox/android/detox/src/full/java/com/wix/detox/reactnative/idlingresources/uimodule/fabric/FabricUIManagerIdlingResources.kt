package com.wix.detox.reactnative.idlingresources.uimodule.fabric

import android.view.Choreographer
import androidx.test.espresso.IdlingResource
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource
import org.joor.Reflect
import java.util.concurrent.ConcurrentLinkedQueue


class FabricUIManagerIdlingResources(
    private val reactContext: ReactContext
) : DetoxIdlingResource(), Choreographer.FrameCallback  {

    override fun checkIdle(): Boolean {
        return if (getViewCommandMountItemsSize() == 0 && getMountItemsSize() == 0) {
            notifyIdle()
            true
        } else {
            Choreographer.getInstance().postFrameCallback(this)
            false
        }
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
        return "Fabric UI"
    }

    override fun getBusyHint(): Map<String, Any> {
        return mapOf("mountItems" to getMountItemsSize(), "viewCommandMountItems" to getViewCommandMountItemsSize())
    }

    override fun getName() = FabricUIManagerIdlingResources::class.java.name

    override fun doFrame(frameTimeNanos: Long) {
        isIdleNow()
    }

    private fun getMountItemsSize(): Int {
        val mountItemDispatcher = getMountItemDispatcher()
        val mountItems = Reflect.on(mountItemDispatcher).field("mMountItems").get<ConcurrentLinkedQueue<*>>()
        return mountItems.size
    }

    private fun getMountItemDispatcher(): Any {
        val fabricUIManager = UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC)
        val mountItemDispatcher = Reflect.on(fabricUIManager).field("mMountItemDispatcher").get<Any>()
        return mountItemDispatcher
    }

    private fun getViewCommandMountItemsSize(): Int {
        val mountItemDispatcher = getMountItemDispatcher()
        val viewCommandMountItems =
            Reflect.on(mountItemDispatcher).field("mViewCommandMountItems").get<ConcurrentLinkedQueue<*>>()
        return viewCommandMountItems.size
    }

}
