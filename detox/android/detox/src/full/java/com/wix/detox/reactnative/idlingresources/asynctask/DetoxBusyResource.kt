package com.wix.detox.reactnative.idlingresources.asynctask

import androidx.test.espresso.IdlingResource
import com.wix.detox.reactnative.idlingresources.IdlingResourceDescription

class DetoxBusyResource(resource: IdlingResource? = null) {
    var resourceMap = HashMap<String, Any>()

    init {
        if (resource != null) {
            val detoxBusyResourceHelper = DetoxBusyResourceHelper()
            resourceMap.putAll(detoxBusyResourceHelper.formatResource(resource))
        }
    }

    constructor(resource: IdlingResourceDescription?) : this() {
        if (resource != null) {
            resourceMap.putAll(resource.json())
        }
    }

    constructor(title: String, internalMap: Map<String, Any>) : this() {
        resourceMap["name"] = title
        resourceMap["description"] = internalMap
    }

    override fun hashCode(): Int {
        return resourceMap.hashCode()
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as DetoxBusyResource

        if (resourceMap != other.resourceMap) return false

        return true
    }

    override fun toString(): String {
        return "DetoxBusyResource(resourceMap=$resourceMap)"
    }
}