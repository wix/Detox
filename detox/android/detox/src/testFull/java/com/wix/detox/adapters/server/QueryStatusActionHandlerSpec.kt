package com.wix.detox.adapters.server

import androidx.test.espresso.IdlingResource
import com.wix.detox.TestEngineFacade
import com.wix.detox.reactnative.idlingresources.DescriptiveIdlingResource
import com.wix.detox.reactnative.idlingresources.IdlingResourceDescription
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

        fun createMockedDescriptiveResource(description: IdlingResourceDescription):
                DescriptiveIdlingResource {
            val resource: DescriptiveIdlingResource = mock()
            whenever(resource.getDescription()).thenReturn(description)
            return resource
        }

        it("should return busy app status with descriptive resource") {
            val fakeDescription = IdlingResourceDescription.Builder()
                .name("foo")
                .addDescription("bar", "baz")
                .addDescription("qux", "quux")
                .build()

            val busyResources: List<IdlingResource> = listOf(
                createMockedDescriptiveResource(fakeDescription)
            )
            whenever(testEngineFacade.getBusyIdlingResources()).thenReturn(busyResources)

            queryStatusHandler().handle(params, messageId)

            val expectedBusyResourceDescription = listOf(
                mapOf("name" to "foo", "description" to mapOf("bar" to "baz", "qux" to "quux"))
            )
            val expectedData =  mapOf("status" to mapOf("app_status" to "busy", "busy_resources" to expectedBusyResourceDescription))
            verify(outboundServerAdapter).sendMessage(eq("currentStatusResult"), eq(expectedData), eq(messageId))
        }

        abstract class LooperIdlingResource: IdlingResource {}

        fun createMockedLooperIdlingResource(resourceName: String): LooperIdlingResource {
            val resource: LooperIdlingResource = mock()
            whenever(resource.name).thenReturn(resourceName)
            return resource
        }

        it("should return busy app status with looper resources") {
            val busyResources: List<IdlingResource> = listOf(
                createMockedLooperIdlingResource("mqt_js"),
                createMockedLooperIdlingResource("mqt_native"),
                createMockedLooperIdlingResource("unmapped")
            )
            whenever(testEngineFacade.getBusyIdlingResources()).thenReturn(busyResources)

            queryStatusHandler().handle(params, messageId)

            val expectedBusyResourceDescription = listOf(
                mapOf(
                    "name" to "looper",
                    "description" to mapOf(
                        "thread" to "\"mqt_js\" (JS Thread)",
                        "execution_type" to "JavaScript code"
                    )
                ),
                mapOf(
                    "name" to "looper",
                    "description" to mapOf(
                        "thread" to "\"mqt_native\" (Native Modules Thread)",
                        "execution_type" to "native module calls"
                    )
                ),
                mapOf(
                    "name" to "looper",
                    "description" to mapOf("thread" to "\"unmapped\"")
                )
            )
            val expectedData =  mapOf("status" to mapOf("app_status" to "busy", "busy_resources" to expectedBusyResourceDescription))
            verify(outboundServerAdapter).sendMessage(eq("currentStatusResult"), eq(expectedData), eq(messageId))
        }

        fun createMockedIdlingResource(name: String): IdlingResource {
            val resource: IdlingResource = mock()
            whenever(resource.name).thenReturn(name)
            return resource
        }

        it("should return busy app status with unknown resource") {
            val busyResources: List<IdlingResource> = listOf(
                createMockedIdlingResource( "quux")
            )
            whenever(testEngineFacade.getBusyIdlingResources()).thenReturn(busyResources)

            queryStatusHandler().handle(params, messageId)

            val expectedBusyResourceDescription = listOf(
                mapOf("name" to "unknown", "description" to mapOf("identifier" to "quux"))
            )
            val expectedData =  mapOf("status" to mapOf("app_status" to "busy", "busy_resources" to expectedBusyResourceDescription))
            verify(outboundServerAdapter).sendMessage(eq("currentStatusResult"), eq(expectedData), eq(messageId))
        }
    }
})