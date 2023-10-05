package com.wix.detox.inquiry

import androidx.test.espresso.IdlingResource
import com.wix.detox.espresso.idlingresources.DescriptiveIdlingResource

sealed class DetoxBusyResource {
    abstract fun getDescription(): DetoxBusyResourceDescription

    class BusyIdlingResource(val resource: IdlingResource): DetoxBusyResource() {
        override fun getDescription() =
            when {
                (resource is DescriptiveIdlingResource) ->
                    getIRDescription(resource)

                (resource.javaClass.name.contains("LooperIdlingResource")) ->
                    getLooperResourceDescriptionByName(resource.name)

                else ->
                    getUnspecifiedResourceDescription(resource)
            }

        private fun getIRDescription(resource: DescriptiveIdlingResource) =
            DetoxBusyResourceDescription.Builder()
                .name(resource.getDebugName())
                .apply {
                    resource.getBusyHint()?.let {
                        it.forEach { hint -> addDescription(hint.key, hint.value) }
                    }
                }
                .build()

        private fun getLooperResourceDescriptionByName(resourceName: String) =
            when {
                isJSCodeExecution(resourceName) -> {
                    getLooperResourceDesc(
                        thread = "\"${resourceName}\" (JS Thread)",
                        executionType = "JavaScript code"
                    )
                }
                isNativeCodeExecution(resourceName) -> {
                    getLooperResourceDesc(
                        thread = "\"${resourceName}\" (Native Modules Thread)",
                        executionType = "native module calls"
                    )
                }
                else -> {
                    getLooperResourceDesc(
                        thread = "\"${resourceName}\""
                    )
                }
            }

        private fun getUnspecifiedResourceDescription(resource: IdlingResource) =
            DetoxBusyResourceDescription.Builder()
                .name("unknown")
                .addDescription("identifier", resource.name)
                .build()

        /**
         * @see URL https://reactnative.dev/docs/profiling
         */
        private fun isJSCodeExecution(looperName: String): Boolean {
            return looperName.contains("mqt_js")
        }

        private fun getLooperResourceDesc(thread: String, executionType: String? = null) =
            DetoxBusyResourceDescription.Builder()
                .name("looper")
                .addDescription("thread", thread)
                .apply {
                    executionType?.let { addDescription("execution_type", executionType) }
                }
                .build()

        /**
         * @see URL https://reactnative.dev/docs/profiling
         */
        private fun isNativeCodeExecution(looperName: String): Boolean {
            return looperName.contains("mqt_native")
        }

    }

    object BusyAsyncTasks: DetoxBusyResource() {
        override fun getDescription() =
            DetoxBusyResourceDescription.Builder()
                .name("bg")
                .addDescription("reason", "native async-tasks")
                .build()

    }
}
