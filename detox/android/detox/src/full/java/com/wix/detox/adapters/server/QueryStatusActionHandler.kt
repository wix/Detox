package com.wix.detox.adapters.server

import androidx.test.espresso.IdlingResource
import com.wix.detox.TestEngineFacade
import com.wix.detox.reactnative.idlingresources.DescriptiveIdlingResource

class QueryStatusActionHandler(
    private val outboundServerAdapter: OutboundServerAdapter,
    private val testEngineFacade: TestEngineFacade
)
    : DetoxActionHandler {

    override fun handle(params: String, messageId: Long) {
        val data = mutableMapOf<String, Any?>()
        data["status"] = formatStatus(testEngineFacade.getBusyIdlingResources())

        outboundServerAdapter.sendMessage("currentStatusResult", data, messageId)
    }

    private fun formatStatus(busyResources: List<IdlingResource>): Map<String, Any> {
        if (busyResources.isEmpty()) {
            return mapOf("app_status" to "idle")
        }

        val status = mutableMapOf<String, Any>()
        status["app_status"] = "busy"
        status["busy_resources"] = busyResources.map{ formatResource(it) }

        return status
    }

    private fun formatResource(resource: IdlingResource): Map<String, Any> {
        if (resource is DescriptiveIdlingResource) {
            return resource.getDescription().json()
        }

        if (resource.javaClass.name.contains("LooperIdlingResource")) {
            return formatLooperResourceFromName(resource.name)
        }

        return mapOf<String, Any>(
            "name" to "unknown",
            "description" to mapOf<String, Any>(
                "identifier" to resource.name
            )
        )
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
        return mapOf<String, Any>(
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
}
