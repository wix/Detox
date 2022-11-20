package com.wix.detox.reactnative.idlingresources.asynctask

import androidx.test.espresso.IdlingResource
import com.wix.detox.reactnative.idlingresources.IdlingResourceDescription

class DetoxBusyResource {
    var resourceMap = HashMap<String, Any>()

    constructor(resource: IdlingResource? = null) {
        resource?.let{
            val detoxBusyResourceHelper = DetoxBusyResourceHelper()
            resourceMap.putAll(detoxBusyResourceHelper.formatResource(it))
        }
    }

    constructor(idlingResourceDescription: IdlingResourceDescription?) {
        idlingResourceDescription?.json()?.let {
            resourceMap.putAll(it)
        }
    }

    constructor(name: String, description: Map<String, Any>) {
        resourceMap["name"] = name
        resourceMap["description"] = description
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