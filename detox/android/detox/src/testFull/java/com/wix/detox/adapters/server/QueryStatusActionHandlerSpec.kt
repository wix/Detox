package com.wix.detox.adapters.server

import com.wix.detox.TestEngineFacade
import com.wix.detox.inquiry.DetoxBusyResource
import com.wix.detox.inquiry.DetoxBusyResourceDescription
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe

object QueryStatusActionHandlerSpec : Spek({
    describe("Query Status Action Handler") {
        val params = "{\"mock\": \"params\"}"
        val messageId = 666L

        lateinit var outboundServerAdapter: OutboundServerAdapter
        lateinit var testEngineFacade: TestEngineFacade

        beforeEachTest {
            outboundServerAdapter = mock()

            testEngineFacade = mock()
            whenever(testEngineFacade.awaitIdle()).then {
                synchronized(testEngineFacade) {}
            }
            whenever(testEngineFacade.syncIdle()).then {
                synchronized(testEngineFacade) {}
            }
        }

        fun uut() = QueryStatusActionHandler(outboundServerAdapter, testEngineFacade)

        describe("given an idle app") {
            it("should send an idle status indication") {
                val expectedData =  mapOf("status" to mapOf("app_status" to "idle"))

                uut().handle(params, messageId)
                verify(outboundServerAdapter).sendMessage(eq("currentStatusResult"), eq(expectedData), eq(messageId))
            }
        }

        describe("given a busy app") {


            fun aBusyResource(identifier: String): DetoxBusyResource {

                return mock<DetoxBusyResource.BusyIdlingResource> {
                    on { getDescription() } doReturn DetoxBusyResourceDescription.Builder()
                        .name("mock")
                        .addDescription("mock", identifier)
                        .build()
                }

            }

            it("should send a descriptive busy-status indication") {
                val busyResource = aBusyResource("some-resource")
                val busyResource2 = aBusyResource("yet-another-resource")
                val expectedData =  mapOf<String, Any>("status" to mapOf(
                    "app_status" to "busy",
                    "busy_resources" to listOf(
                        mapOf("name" to "mock", "description" to mapOf("mock" to "some-resource")),
                        mapOf("name" to "mock", "description" to mapOf("mock" to "yet-another-resource"))
                    )
                ))
                whenever(testEngineFacade.getAllBusyResources()).thenReturn(listOf(busyResource, busyResource2))

                uut().handle(params, messageId)
                verify(outboundServerAdapter).sendMessage(eq("currentStatusResult"), eq(expectedData), eq(messageId))
            }
        }
   }
})
