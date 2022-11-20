package com.wix.detox.adapters.server

import com.wix.detox.TestEngineFacade
import com.wix.detox.reactnative.idlingresources.asynctask.DetoxBusyResource

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

    private fun formatStatus(busyResources: List<DetoxBusyResource>): Map<String, Any> {
        if (busyResources.isEmpty()) {
            return mapOf("app_status" to "idle")
        }

        val status = mutableMapOf<String, Any>()
        status["app_status"] = "busy"
        status["busy_resources"] = busyResources.map{ it.resourceMap }

        return status
    }
}
