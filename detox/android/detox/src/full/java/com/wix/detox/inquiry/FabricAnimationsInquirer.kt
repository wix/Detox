package com.wix.detox.inquiry

import android.util.Log
import android.util.SparseArray
import android.view.View
import com.facebook.react.animated.AnimatedNode
import com.facebook.react.animated.NativeAnimatedModule
import com.facebook.react.animated.NativeAnimatedNodesManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import java.lang.reflect.Field
import java.util.LinkedList
import java.util.concurrent.atomic.AtomicReference

object FabricAnimationsInquirer {
    private const val LOG_TAG = "FabricAnimationsInquirer"

    // Cache fields to avoid repeated reflection lookups
    private var mActiveAnimationsField: Field? = null
    private var mUpdatedNodesField: Field? = null
    private var mAnimatedNodesField: Field? = null
    private var animatedValueField: Field? = null
    private var childrenField: Field? = null
    private var connectedViewTagField: Field? = null
    private var propNodeMappingField: Field? = null
    private var propMappingField: Field? = null
    private var nodeValueField: Field? = null
    private var offsetField: Field? = null

    fun logAnimatingViews(reactContext: ReactApplicationContext) {
        try {
            Log.d(LOG_TAG, "Starting animation inquiry...")

            // Clear previous animated views - fresh start for this inquiry
            ViewLifecycleRegistry.clearAnimatedViews()

            val nodesManager = getNodesManager(reactContext) ?: return
            Log.d(LOG_TAG, "Got nodesManager: ${nodesManager.javaClass.simpleName}")

            // Check if there are any active animations first
            val hasActive = nodesManager.hasActiveAnimations()
            Log.d(LOG_TAG, "hasActiveAnimations() returned: $hasActive")

            if (!hasActive) {
                Log.d(LOG_TAG, "No active animations detected")
                return
            }

            // Get all animated nodes from the graph
            val allNodes = getAllAnimatedNodes(nodesManager)
            Log.d(LOG_TAG, "Found ${allNodes.size()} total animated nodes")

            // Log the field names we're using for debugging
            Log.d(LOG_TAG, "Using field names: mActiveAnimations, mUpdatedNodes, mAnimatedNodes")

            // Find nodes that are currently animating (have active drivers or are updated)
            val animatingNodes = findAnimatingNodes(nodesManager, allNodes)
            Log.d(LOG_TAG, "Found ${animatingNodes.size} animating nodes")

            if (animatingNodes.isEmpty()) {
                Log.d(LOG_TAG, "No animating nodes found, exiting")
                return
            }

            // Find all relevant animated nodes (PropsAnimatedNode, StyleAnimatedNode, ValueAnimatedNode)
            val relevantNodes = findPropsNodes(animatingNodes, allNodes)
            Log.d(LOG_TAG, "Found ${relevantNodes.size} relevant animated nodes")

            if (relevantNodes.isEmpty()) {
                Log.d(LOG_TAG, "No relevant animated nodes found, exiting")
                return
            }

            val viewTags = getViewTags(relevantNodes, allNodes)
            Log.d(LOG_TAG, "Found ${viewTags.size} view tags: $viewTags")

            if (viewTags.isEmpty()) {
                Log.d(LOG_TAG, "No view tags found, exiting")
                return
            }

            logViews(reactContext, viewTags)
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to inquire animating views", e)
        }
    }

    private fun getNodesManager(reactContext: ReactApplicationContext): NativeAnimatedNodesManager? {
        val nativeAnimatedModule = reactContext.getNativeModule(NativeAnimatedModule::class.java)
        if (nativeAnimatedModule == null) {
            Log.d(LOG_TAG, "NativeAnimatedModule not found")
            return null
        }

        return try {
            // Use the public getNodesManager() method instead of reflection
            nativeAnimatedModule.nodesManager
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to get NativeAnimatedNodesManager via getNodesManager()", e)
            null
        }
    }

    private fun getAllAnimatedNodes(nodesManager: NativeAnimatedNodesManager): SparseArray<AnimatedNode> {
        val allNodes = SparseArray<AnimatedNode>()
        try {
            // Access mAnimatedNodes field using reflection
            val animatedNodesField = findOrCacheField(nodesManager.javaClass, "mAnimatedNodes", "mAnimatedNodesField")
            @Suppress("UNCHECKED_CAST")
            val animatedNodes = animatedNodesField?.get(nodesManager) as? SparseArray<AnimatedNode>
            if (animatedNodes != null) {
                Log.d(LOG_TAG, "Found ${animatedNodes.size()} animated nodes in graph")
                for (i in 0 until animatedNodes.size()) {
                    val node = animatedNodes.valueAt(i)
                    allNodes.put(animatedNodes.keyAt(i), node)
                }
            } else {
                Log.w(LOG_TAG, "Could not access mAnimatedNodes field")
            }
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to get all animated nodes", e)
        }
        return allNodes
    }

    private fun findAnimatingNodes(nodesManager: NativeAnimatedNodesManager, allNodes: SparseArray<AnimatedNode>): Set<AnimatedNode> {
        val animatingNodes = mutableSetOf<AnimatedNode>()

        try {
            // Get nodes from active animations
            val activeAnimationsField = findOrCacheField(nodesManager.javaClass, "mActiveAnimations", "mActiveAnimationsField")
            @Suppress("UNCHECKED_CAST")
            val activeAnimations = activeAnimationsField?.get(nodesManager) as? SparseArray<Any>
            if (activeAnimations != null) {
                Log.d(LOG_TAG, "Found ${activeAnimations.size()} active animations")
                for (i in 0 until activeAnimations.size()) {
                    val driver = activeAnimations.valueAt(i)
                    Log.d(LOG_TAG, "Active animation driver: ${driver.javaClass.simpleName}")
                    val animatedValueField = findOrCacheField(driver.javaClass, "animatedValue", "animatedValueField")
                    val valueNode = animatedValueField?.get(driver) as? AnimatedNode
                    if (valueNode != null) {
                        animatingNodes.add(valueNode)
                        Log.d(LOG_TAG, "Added animating node from active animation: ${valueNode.javaClass.simpleName}")
                    }
                }
            }

            // Get nodes from updated nodes
            val updatedNodesField = findOrCacheField(nodesManager.javaClass, "mUpdatedNodes", "mUpdatedNodesField")
            @Suppress("UNCHECKED_CAST")
            val updatedNodes = updatedNodesField?.get(nodesManager) as? SparseArray<AnimatedNode>
            if (updatedNodes != null) {
                Log.d(LOG_TAG, "Found ${updatedNodes.size()} updated nodes")
                for (i in 0 until updatedNodes.size()) {
                    val node = updatedNodes.valueAt(i)
                    animatingNodes.add(node)
                    Log.d(LOG_TAG, "Added updated node: ${node.javaClass.simpleName}")
                }
            }
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to find animating nodes", e)
        }

        return animatingNodes
    }

    private fun findPropsNodes(animatingNodes: Set<AnimatedNode>, allNodes: SparseArray<AnimatedNode>): Set<Any> {
        val allRelevantNodes = mutableSetOf<Any>()
        val queue = LinkedList<AnimatedNode>(animatingNodes)
        val visited = mutableSetOf<AnimatedNode>()

        while (queue.isNotEmpty()) {
            val node = queue.poll()
            if (node in visited) {
                continue
            }
            visited.add(node)

            // Check what type of node this is and log accordingly
            val nodeType = node.javaClass.simpleName
            when (nodeType) {
                "PropsAnimatedNode" -> {
                    allRelevantNodes.add(node)
                    Log.d(LOG_TAG, "Found PropsAnimatedNode: $nodeType")
                }
                "StyleAnimatedNode" -> {
                    allRelevantNodes.add(node)
                    Log.d(LOG_TAG, "Found StyleAnimatedNode: $nodeType")
                }
                "ValueAnimatedNode" -> {
                    allRelevantNodes.add(node)
                    Log.d(LOG_TAG, "Found ValueAnimatedNode: $nodeType")
                }
                else -> {
                    Log.d(LOG_TAG, "Found other animated node: $nodeType")
                }
            }

            // Traverse children to find more nodes
            try {
                val childrenField = findOrCacheField(node.javaClass, "children", "childrenField")
                @Suppress("UNCHECKED_CAST")
                val children = childrenField?.get(node) as? List<AnimatedNode>
                if (children != null) {
                    queue.addAll(children)
                }
            } catch (e: Exception) {
                // Ignored - not all nodes have children
            }
        }

        return allRelevantNodes
    }

    private fun isPropsAnimatedNode(node: AnimatedNode): Boolean {
        return try {
            // Check if this is actually a PropsAnimatedNode by checking the class name
            // and verifying it has the connectedViewTag field
            val isPropsNode = node.javaClass.simpleName == "PropsAnimatedNode"
            if (isPropsNode) {
                val connectedViewTagField = findOrCacheField(node.javaClass, "connectedViewTag", "connectedViewTagField")
                connectedViewTagField != null
            } else {
                false
            }
        } catch (e: Exception) {
            false
        }
    }

    private fun getViewTags(relevantNodes: Set<Any>, allNodes: SparseArray<AnimatedNode>): Set<Int> {
        val viewTags = mutableSetOf<Int>()
        for (node in relevantNodes) {
            try {
                val nodeType = node.javaClass.simpleName
                Log.d(LOG_TAG, "Processing $nodeType for view tags")

                when (nodeType) {
                    "PropsAnimatedNode" -> {
                        val connectedViewTagField = findOrCacheField(node.javaClass, "connectedViewTag", "connectedViewTagField")
                        val viewTag = connectedViewTagField?.get(node) as? Int
                        if (viewTag != null && viewTag != -1) {
                            viewTags.add(viewTag)
                            Log.d(LOG_TAG, "PropsAnimatedNode connected to view tag: $viewTag")

                            // Log the property mapping to see what properties are being animated
                            try {
                                val propNodeMappingField = findOrCacheField(node.javaClass, "propNodeMapping", "propNodeMappingField")
                                val propNodeMapping = propNodeMappingField?.get(node) as? Map<String, Int>
                                if (propNodeMapping != null) {
                                    Log.d(LOG_TAG, "View $viewTag has animated properties: ${propNodeMapping.keys}")
                                }
                            } catch (e: Exception) {
                                Log.d(LOG_TAG, "Could not access propNodeMapping for PropsAnimatedNode")
                            }
                        }
                    }
                    "StyleAnimatedNode" -> {
                        // StyleAnimatedNode doesn't have connectedViewTag field - it's connected through PropsAnimatedNode
                        Log.d(LOG_TAG, "StyleAnimatedNode has no direct view connection (connected through PropsAnimatedNode)")

                        // Try to access propMapping to see what properties it handles
                        try {
                            val propMappingField = findOrCacheField(node.javaClass, "propMapping", "propMappingField")
                            val propMapping = propMappingField?.get(node) as? Map<String, Int>
                            if (propMapping != null) {
                                Log.d(LOG_TAG, "StyleAnimatedNode handles properties: ${propMapping.keys}")
                            }
                        } catch (e: Exception) {
                            Log.d(LOG_TAG, "Could not access StyleAnimatedNode propMapping: ${e.message}")
                        }

                        // Find the connected view by traversing the graph to find PropsAnimatedNode
                        val connectedViewTag = findConnectedViewThroughGraph(node as AnimatedNode, allNodes)
                        if (connectedViewTag != -1) {
                            viewTags.add(connectedViewTag)
                            Log.d(LOG_TAG, "StyleAnimatedNode connected to view tag through graph: $connectedViewTag")
                        } else {
                            Log.w(LOG_TAG, "StyleAnimatedNode has no connected view - this could mean:")
                            Log.w(LOG_TAG, "  1. No PropsAnimatedNode found in graph traversal")
                            Log.w(LOG_TAG, "  2. PropsAnimatedNode exists but not connected to any view")
                            Log.w(LOG_TAG, "  3. Graph traversal failed due to reflection errors")
                            Log.w(LOG_TAG, "  4. Circular references or disconnected graph")
                        }
                    }
                    "ValueAnimatedNode" -> {
                        // ValueAnimatedNode typically doesn't have direct view connection
                        // but we can log its value for debugging
                        try {
                            val nodeValueField = findOrCacheField(node.javaClass, "nodeValue", "nodeValueField")
                            val nodeValue = nodeValueField?.get(node) as? Double
                            val offsetField = findOrCacheField(node.javaClass, "offset", "offsetField")
                            val offset = offsetField?.get(node) as? Double
                            Log.d(LOG_TAG, "ValueAnimatedNode value: $nodeValue, offset: $offset")
                        } catch (e: Exception) {
                            Log.d(LOG_TAG, "Could not access ValueAnimatedNode values: ${e.message}")
                        }
                    }
                    else -> {
                        Log.d(LOG_TAG, "Unknown node type: $nodeType")
                    }
                }
            } catch (e: Exception) {
                Log.e(LOG_TAG, "Failed to process node: ${node.javaClass.simpleName}", e)
            }
        }
        return viewTags
    }

    private fun logViews(reactContext: ReactApplicationContext, viewTags: Set<Int>) {
        val uiManager = UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC)
        if (uiManager == null) {
            Log.w(LOG_TAG, "Fabric UIManager not found.")
            return
        }

        for (tag in viewTags) {
            try {
                reactContext.runOnUiQueueThread {
                    val view = uiManager.resolveView(tag)
                    if (view != null) {
                        ViewLifecycleRegistry.markAnimated(view)
                        Log.i(LOG_TAG, "Animating view: tag=$tag, class=${view.javaClass.simpleName}, id=${view.id}")
                    } else {
                        Log.w(LOG_TAG, "Could not resolve view for tag: $tag")
                    }
                }
            } catch (e: Exception) {
                Log.e(LOG_TAG, "Failed to resolve or log view for tag: $tag", e)
            }
        }
    }

    private fun findOrCacheField(clazz: Class<*>, fieldName: String, cacheFieldName: String): Field? {
        try {
            val cacheField = FabricAnimationsInquirer::class.java.getDeclaredField(cacheFieldName).apply { isAccessible = true }
            var field = cacheField.get(this) as? Field
            if (field == null) {
                field = findFieldRecursive(clazz, fieldName)
                if (field != null) {
                    cacheField.set(this, field)
                }
            }
            return field
        } catch (e: Exception) {
            Log.w(LOG_TAG, "Could not find or cache field $fieldName", e)
            return null
        }
    }

    private fun findFieldRecursive(clazz: Class<*>, fieldName: String): Field? {
        var currentClass: Class<*>? = clazz
        while (currentClass != null && currentClass != Any::class.java) {
            try {
                return currentClass.getDeclaredField(fieldName).apply { isAccessible = true }
            } catch (e: NoSuchFieldException) {
                // Not in this class, check superclass
            }
            currentClass = currentClass.superclass
        }
        Log.w(LOG_TAG, "Field '$fieldName' not found in class hierarchy for '${clazz.simpleName}'")
        return null
    }

    private fun findConnectedViewThroughGraph(startNode: AnimatedNode, allNodes: SparseArray<AnimatedNode>): Int {
        val queue = LinkedList<AnimatedNode>()
        val visited = mutableSetOf<AnimatedNode>()
        var propsNodesFound = 0
        var propsNodesWithView = 0
        var propsNodesWithoutView = 0

        Log.d(LOG_TAG, "Starting graph traversal from ${startNode.javaClass.simpleName}")

        queue.add(startNode)
        visited.add(startNode)

        while (queue.isNotEmpty()) {
            val node = queue.poll()
            val nodeType = node.javaClass.simpleName

            // Check if this is a PropsAnimatedNode with a connected view
            if (nodeType == "PropsAnimatedNode") {
                propsNodesFound++
                try {
                    val connectedViewTagField = findOrCacheField(node.javaClass, "connectedViewTag", "connectedViewTagField")
                    val viewTag = connectedViewTagField?.get(node) as? Int
                    if (viewTag != null && viewTag != -1) {
                        propsNodesWithView++
                        Log.d(LOG_TAG, "Found PropsAnimatedNode with connected view: $viewTag")
                        return viewTag
                    } else {
                        propsNodesWithoutView++
                        Log.d(LOG_TAG, "Found PropsAnimatedNode but no connected view (viewTag: $viewTag)")
                    }
                } catch (e: Exception) {
                    Log.w(LOG_TAG, "Failed to access connectedViewTag from PropsAnimatedNode: ${e.message}")
                }
            }

            // Traverse children to find PropsAnimatedNode
            try {
                val childrenField = findOrCacheField(node.javaClass, "children", "childrenField")
                @Suppress("UNCHECKED_CAST")
                val children = childrenField?.get(node) as? List<AnimatedNode>
                if (children != null) {
                    Log.d(LOG_TAG, "Traversing ${children.size} children from $nodeType")
                    for (child in children) {
                        if (child !in visited) {
                            visited.add(child)
                            queue.add(child)
                        }
                    }
                } else {
                    Log.d(LOG_TAG, "$nodeType has no children")
                }
            } catch (e: Exception) {
                Log.d(LOG_TAG, "Could not access children from $nodeType: ${e.message}")
            }
        }

        Log.w(LOG_TAG, "Graph traversal completed:")
        Log.w(LOG_TAG, "  - Total nodes visited: ${visited.size}")
        Log.w(LOG_TAG, "  - PropsAnimatedNodes found: $propsNodesFound")
        Log.w(LOG_TAG, "  - PropsAnimatedNodes with view: $propsNodesWithView")
        Log.w(LOG_TAG, "  - PropsAnimatedNodes without view: $propsNodesWithoutView")

        return -1
    }
}
