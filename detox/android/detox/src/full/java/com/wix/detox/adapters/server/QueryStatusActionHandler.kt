package com.wix.detox.adapters.server

import com.wix.detox.TestEngineFacade
import com.wix.detox.inquiry.DetoxBusyResource

class QueryStatusActionHandler(
    private val outboundServerAdapter: OutboundServerAdapter,
    private val testEngineFacade: TestEngineFacade
) : DetoxActionHandler {

    override fun handle(params: String, messageId: Long) {
        val busyResources = testEngineFacade.getAllBusyResources()
        val data = mapOf<String, Any?>(
            "status" to formatStatus(busyResources)
        )
        outboundServerAdapter.sendMessage("currentStatusResult", data, messageId)
    }

    private fun formatStatus(busyResources: List<DetoxBusyResource>): Map<String, Any> =
        if (busyResources.isEmpty()) {
            mapOf("app_status" to "idle")
        } else {
            mapOf(
                "app_status" to "busy",
                "busy_resources" to busyResources.map { it.getDescription().json() }
            )
        }
}
