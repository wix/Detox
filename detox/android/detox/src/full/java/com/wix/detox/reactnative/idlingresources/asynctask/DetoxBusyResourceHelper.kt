package com.wix.detox.reactnative.idlingresources.asynctask

import androidx.test.espresso.IdlingResource
import com.wix.detox.reactnative.idlingresources.DescriptiveIdlingResource

class DetoxBusyResourceHelper {
    fun formatResource(resource: IdlingResource): Map<String, Any> {
        if (resource is DescriptiveIdlingResource) {
            return resource.getDescription().json()
        }

        if (resource.javaClass.name.contains("LooperIdlingResource")) {
            return formatLooperResourceFromName(resource.name)
        }

        val ret = mapOf(
            "name" to "unknown",
            "description" to mapOf<String, Any>(
                "identifier" to resource.name
            )
        )

        return ret
    }

    private fun formatLooperResourceFromName(resourceName: String): Map<String, Any> {
        return when {
            isJSCodeExecution(resourceName) -> {
                formatLooperResource(
                    "\"${resourceName}\" (JS Thread)",
                    "JavaScript code"
                )
            }
            isNativeCodeExecution(resourceName) -> {
                formatLooperResource(
                    "\"${resourceName}\" (Native Modules Thread)",
                    "native module calls"
                )
            }
            else -> {
                formatLooperResource(
                    "\"${resourceName}\""
                )
            }
        }
    }

    /**
     * @see URL https://reactnative.dev/docs/profiling
     */
    private fun isJSCodeExecution(looperName: String): Boolean {
        return looperName.contains("mqt_js")
    }

    private fun formatLooperResource(thread: String, executionType: String? = null): Map<String, Any> {
        return mapOf(
            "name" to "looper",
            "description" to
                    mutableMapOf<String, Any>(
                        "thread" to thread
                    ).apply {
                        if (executionType != null) put("execution_type", executionType)
                    }
        )
    }

    /**
     * @see URL https://reactnative.dev/docs/profiling
     */
    private fun isNativeCodeExecution(looperName: String): Boolean {
        return looperName.contains("mqt_native")
    }

    fun convertToDetoxBusyResourcesList(resources: List<IdlingResource>): List<DetoxBusyResource> {
        val retList = mutableListOf<DetoxBusyResource>()

        resources.forEach { resource ->
            retList.add(DetoxBusyResource(resource))
        }

        return retList
    }
}