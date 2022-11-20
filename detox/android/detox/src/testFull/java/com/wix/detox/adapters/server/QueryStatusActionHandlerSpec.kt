package com.wix.detox.adapters.server

import com.wix.detox.TestEngineFacade
import com.wix.detox.reactnative.idlingresources.IdlingResourceDescription
import com.wix.detox.reactnative.idlingresources.asynctask.DetoxBusyResource
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

        fun queryStatusHandler() = QueryStatusActionHandler(outboundServerAdapter, testEngineFacade)

        it("should return idle app status") {
            queryStatusHandler().handle(params, messageId)
            val expectedData =  mapOf("status" to mapOf("app_status" to "idle"))
            verify(outboundServerAdapter).sendMessage(eq("currentStatusResult"), eq(expectedData), eq(messageId))
        }

        fun createMockedDetoxBusyResource(idlingResourceDescription: IdlingResourceDescription):
        DetoxBusyResource {
            return DetoxBusyResource(idlingResourceDescription)
        }

        it("should return busy app status with descriptive resource") {
            val fakeDescription = IdlingResourceDescription.Builder()
                .name("foo")
                .addDescription("bar", "baz")
                .addDescription("qux", "quux")
                .build()

            val busyResources: List<DetoxBusyResource> = listOf(
                createMockedDetoxBusyResource(fakeDescription)
            )
            whenever(testEngineFacade.getBusyIdlingResources()).thenReturn(busyResources)

            queryStatusHandler().handle(params, messageId)

            val expectedBusyResourceDescription = listOf(
                mapOf("name" to "foo", "description" to mapOf("bar" to "baz", "qux" to "quux"))
            )
            val expectedData =  mapOf("status" to mapOf("app_status" to "busy", "busy_resources" to expectedBusyResourceDescription))
            verify(outboundServerAdapter).sendMessage(eq("currentStatusResult"), eq(expectedData), eq(messageId))
        }
    }
})