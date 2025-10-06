package com.wix.detox.reactnative.idlingresources.uimodule.fabric

import android.util.Log
import android.view.Choreographer
import androidx.test.espresso.IdlingResource
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource
import com.wix.detox.inquiry.ViewLifecycleRegistry
import org.joor.Reflect
import java.util.concurrent.ConcurrentLinkedQueue


class FabricUIManagerIdlingResources(
    private val reactContext: ReactContext
) : DetoxIdlingResource(), Choreographer.FrameCallback  {

    override fun checkIdle(): Boolean {
        val mountItemsSize = getMountItemsSize()
        val viewCommandMountItemsSize = getViewCommandMountItemsSize()

        return if (mountItemsSize == 0 && viewCommandMountItemsSize == 0) {
            notifyIdle()
            true
        } else {
            // Track mount items to identify animated views
            trackMountItems()
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

    /**
     * Track mount items to identify animated views.
     * This is called when the UI manager is busy processing mount items.
     */
    private fun trackMountItems() {
        try {
            val mountItemDispatcher = getMountItemDispatcher()
            val mountItems = Reflect.on(mountItemDispatcher).field("mMountItems").get<ConcurrentLinkedQueue<*>>()

            // Track each mount item to identify animated views
            mountItems.forEach { mountItem ->
                trackMountItem(mountItem)
            }
        } catch (e: Exception) {
            // Silently ignore errors to avoid breaking the idling resource
        }
    }

    /**
     * Track individual mount item to identify animated views.
     */
    private fun trackMountItem(mountItem: Any) {
        try {
            val mountItemClass = mountItem.javaClass.simpleName
            Log.i("DetoxFabricDebug", "Processing mount item: $mountItemClass")

            when (mountItemClass) {
                "IntBufferBatchMountItem" -> {
                    Log.i("DetoxFabricDebug", "Found IntBufferBatchMountItem - processing animated props")
                    // This is where animated props get applied
                    trackIntBufferBatchMountItem(mountItem)
                }
                "CreateMountItem" -> {
                    Log.i("DetoxFabricDebug", "Found CreateMountItem - processing view creation")
                    // Track view creation
                    trackCreateMountItem(mountItem)
                }
                else -> {
                    Log.i("DetoxFabricDebug", "Unknown mount item type: $mountItemClass")
                }
                // Add other mount item types as needed
            }
        } catch (e: Exception) {
            Log.e("DetoxFabricDebug", "Error processing mount item", e)
        }
    }

    /**
     * Track IntBufferBatchMountItem which contains animated prop updates.
     */
    private fun trackIntBufferBatchMountItem(mountItem: Any) {
        try {
            // Use reflection to access the mount item's data
            val intBuffer = Reflect.on(mountItem).field("mIntBuffer").get<IntArray>()
            val objBuffer = Reflect.on(mountItem).field("mObjBuffer").get<Array<Any>>()

            var i = 0
            var j = 0

            while (i < intBuffer.size) {
                val instruction = intBuffer[i++]

                when (instruction) {
                    32 -> { // INSTRUCTION_UPDATE_PROPS
                        val viewTag = intBuffer[i++]
                        val props = objBuffer[j++] as? com.facebook.react.bridge.ReadableMap
                        
                        // Track animated view update
                        trackAnimatedViewUpdate(viewTag, props)
                    }
                    2 -> { // INSTRUCTION_CREATE
                        val viewTag = intBuffer[i++]
                        // Mark as mounted
                        val fabricUIManager = UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC)
                        val view = getViewByTag(fabricUIManager as Any, viewTag)
                        view?.let { ViewLifecycleRegistry.markMounted(it) }
                    }
                    8 -> { // INSTRUCTION_INSERT
                        val parentTag = intBuffer[i++]
                        val viewTag = intBuffer[i++]
                        val index = intBuffer[i++]
                        // Mark as mounted
                        val fabricUIManager = UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC)
                        val view = getViewByTag(fabricUIManager as Any, viewTag)
                        view?.let { ViewLifecycleRegistry.markMounted(it) }
                    }
                    16 -> { // INSTRUCTION_REMOVE
                        val parentTag = intBuffer[i++]
                        val viewTag = intBuffer[i++]
                        val index = intBuffer[i++]
                        // View is being removed, no need to track
                    }
                    128 -> { // INSTRUCTION_UPDATE_LAYOUT
                        val viewTag = intBuffer[i++]
                        // Mark as updated
                        val fabricUIManager = UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC)
                        val view = getViewByTag(fabricUIManager as Any, viewTag)
                        view?.let { ViewLifecycleRegistry.markUpdated(it) }
                    }
                    // Skip other instruction types
                }
            }
        } catch (e: Exception) {
            // Silently ignore errors to avoid breaking the idling resource
        }
    }

    /**
     * Track CreateMountItem for view creation.
     */
    private fun trackCreateMountItem(mountItem: Any) {
        try {
            val viewTag = Reflect.on(mountItem).field("mReactTag").get<Int>()
            // We can't get the actual View here, but we can track the tag
            // The actual View will be available when it's mounted
        } catch (e: Exception) {
            // Silently ignore errors
        }
    }

    /**
     * Track animated view update.
     */
    private fun trackAnimatedViewUpdate(viewTag: Int, props: com.facebook.react.bridge.ReadableMap?) {
        try {
            // Get the actual Android View
            val fabricUIManager = UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC)
            val view = getViewByTag(fabricUIManager as Any, viewTag)

            if (view != null) {
                // Check if this is an animated update
                val isAnimated = isAnimatedPropsUpdate(props)

                if (isAnimated) {
                    ViewLifecycleRegistry.markAnimated(view)
                } else {
                    ViewLifecycleRegistry.markUpdated(view)
                }
            }
        } catch (e: Exception) {
            // Silently ignore errors to avoid breaking the idling resource
        }
    }

    /**
     * Get Android View by React Native view tag using correct Fabric APIs.
     */
    private fun getViewByTag(fabricUIManager: Any, viewTag: Int): android.view.View? {
        return try {
            // Get MountingManager from FabricUIManager
            val mountingManager = Reflect.on(fabricUIManager).field("mMountingManager").get<Any>()
            
            // Get SurfaceMountingManager for the view
            val getSurfaceManagerMethod = mountingManager.javaClass.getMethod("getSurfaceManagerForView", Int::class.java)
            val surfaceMountingManager = getSurfaceManagerMethod.invoke(mountingManager, viewTag)
            
            if (surfaceMountingManager != null) {
                // Get the actual Android View
                val getViewMethod = surfaceMountingManager.javaClass.getMethod("getView", Int::class.java)
                getViewMethod.invoke(surfaceMountingManager, viewTag) as? android.view.View
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Check if this is an animated props update.
     */
    private fun isAnimatedPropsUpdate(props: com.facebook.react.bridge.ReadableMap?): Boolean {
        if (props == null) {
            Log.i("DetoxFabricDebug", "Props is null - not animated")
            return false
        }

        val animatedKeys = setOf(
            "transform", "opacity", "scaleX", "scaleY", "scale",
            "translateX", "translateY", "rotateX", "rotateY", "rotateZ",
            "backgroundColor", "borderRadius", "borderWidth"
        )

        Log.i("DetoxFabricDebug", "Checking props for animated keys...")

        val iterator = props.keySetIterator()
        while (iterator.hasNextKey()) {
            val key = iterator.nextKey()
            Log.i("DetoxFabricDebug", "Checking key: $key")
            if (animatedKeys.any { key.contains(it, ignoreCase = true) }) {
                Log.i("DetoxFabricDebug", "Found animated key: $key")
                return true
            }
        }

        Log.i("DetoxFabricDebug", "No animated keys found")
        return false
    }

}
