package com.wix.detox.inquiry

import androidx.test.espresso.IdlingResource
import com.wix.detox.espresso.idlingresources.DescriptiveIdlingResource
import org.assertj.core.api.Assertions.assertThat
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe

class DetoxBusyResourceSpec: Spek({
    describe("Detox busy resource") {
        data class TestCase<in T: IdlingResource>(
            val caseTitle: String,
            val idlingResource: IdlingResource,
            val expectedDescription: DetoxBusyResourceDescription
        )

        describe("given a descriptive idling resource") {
            val mockedDebugName = "mock:debug-name"

            fun aDescriptiveIdlingResource(busyHint: Map<String, Any>?): DescriptiveIdlingResource =
                mock() {
                    on { getDebugName() }.doReturn(mockedDebugName)
                    on { getBusyHint() }.doReturn(busyHint)
                }

            listOf(
                TestCase<IdlingResource>(
                    caseTitle = "should return a description based on debug-name and busy-hint",
                    idlingResource = aDescriptiveIdlingResource(mapOf("mocked" to "hint", "mocked2" to "hint2")),
                    expectedDescription = DetoxBusyResourceDescription.Builder()
                        .name(mockedDebugName)
                        .addDescription("mocked", "hint")
                        .addDescription("mocked2", "hint2")
                        .build()
                ),
                TestCase(
                    caseTitle = "should return a description even without a busy-hint",
                    idlingResource = aDescriptiveIdlingResource(busyHint = null),
                    expectedDescription = DetoxBusyResourceDescription.Builder()
                        .name(mockedDebugName)
                        .build()
                ),
            ).forEach { (caseTitle, idlingResource, expectedDescription)  ->
                it(caseTitle) {
                    val uut = DetoxBusyResource.BusyIdlingResource(idlingResource)

                    assertThat(uut.resource).isEqualTo(idlingResource)
                    assertThat(uut.getDescription()).isEqualTo(expectedDescription)
                }
            }
        }

        describe("given a looper idling resource") {

            abstract class LooperIdlingResource: IdlingResource {}

            fun aLooperIdlingResourceMock(resourceName: String): LooperIdlingResource =
                mock() {
                    on { name }.doReturn(resourceName)
                }

            listOf(
                TestCase<LooperIdlingResource>(
                    caseTitle = "should return a tailored description for the js-thread looper",
                    idlingResource = aLooperIdlingResourceMock("mqt_js"),
                    expectedDescription = DetoxBusyResourceDescription.Builder()
                        .name("looper")
                        .addDescription("thread", "\"mqt_js\" (JS Thread)")
                        .addDescription("execution_type", "JavaScript code")
                        .build(),
                ),
                TestCase<LooperIdlingResource>(
                    caseTitle = "should return a tailored description for native-modules thread",
                    idlingResource = aLooperIdlingResourceMock("mqt_native"),
                    expectedDescription = DetoxBusyResourceDescription.Builder()
                        .name("looper")
                        .addDescription("thread", "\"mqt_native\" (Native Modules Thread)")
                        .addDescription("execution_type", "native module calls")
                        .build()
                ),
                TestCase<LooperIdlingResource>(
                    caseTitle = "should return a default description for unspecified looper-threads",
                    idlingResource = aLooperIdlingResourceMock("unmapped"),
                    expectedDescription = DetoxBusyResourceDescription.Builder()
                        .name("looper")
                        .addDescription("thread", "\"unmapped\"")
                        .build(),
                ),
            ).forEach { (caseTitle, idlingResource, expectedDescription) ->
                it(caseTitle) {
                    val uut = DetoxBusyResource.BusyIdlingResource(idlingResource)

                    assertThat(uut.resource).isEqualTo(idlingResource)
                    assertThat(uut.getDescription()).isEqualTo(expectedDescription)
                }
            }
        }

        describe("given a generic idling resource") {
            val mockedResourceName = "mock:resource-name"

            listOf(
                TestCase<IdlingResource>(
                    caseTitle = "should return a generic description for a generic idling resource",
                    idlingResource = mock { on { name}.doReturn(mockedResourceName) },
                    expectedDescription = DetoxBusyResourceDescription.Builder()
                        .name("unknown")
                        .addDescription("identifier", mockedResourceName)
                        .build()
                )
            ).forEach { (caseTitle, idlingResource, expectedDescription) ->
                it (caseTitle) {
                    val uut = DetoxBusyResource.BusyIdlingResource(idlingResource)

                    assertThat(uut.resource).isEqualTo(idlingResource)
                    assertThat(uut.getDescription()).isEqualTo(expectedDescription)
                }
            }
        }

        describe("busy async-task(s) description") {
            it("should return a general description") {
                val expectedDescription = DetoxBusyResourceDescription.Builder()
                    .name("bg")
                    .addDescription("reason", "native async-tasks")
                    .build()

                assertThat(DetoxBusyResource.BusyAsyncTasks.getDescription()).isEqualTo(expectedDescription)
            }
        }
    }
})
