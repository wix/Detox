package com.wix.detox.espresso.registry

import android.os.Looper
import androidx.test.espresso.IdlingResource
import androidx.test.espresso.base.IdlingResourceRegistry
import com.wix.detox.UTHelpers
import com.wix.detox.reactnative.idlingresources.DescriptiveIdlingResource
import com.wix.detox.reactnative.idlingresources.IdlingResourceDescription
import com.wix.detox.reactnative.idlingresources.asynctask.DetoxBusyResource
import com.wix.detox.reactnative.idlingresources.asynctask.UiControllerImplReflected
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.doAnswer
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.LooperMode
import java.util.concurrent.Executors

@RunWith(RobolectricTestRunner::class)
// Fixes: Hangs in UIThread.postFirstSync inside IRStatusInquirer.getAllBusyResources when upgrading robolectric 4.3.x -> 4.4
// See http://robolectric.org/blog/2019/06/04/paused-looper/ (coming from https://github.com/robolectric/robolectric/releases/tag/robolectric-4.4)
@LooperMode(LooperMode.Mode.LEGACY)
class IRStatusInquirerTest {
    private lateinit var registry: IdlingResourceRegistry
    private lateinit var uut: IRStatusInquirer
    private lateinit var uiControllerImplReflected: UiControllerImplReflected

    private fun anIdleResource() = mock<IdlingResource> {
        on { isIdleNow } doReturn true
    }

    private fun aBusyResource() = mock<IdlingResource> {
        on { isIdleNow } doReturn false
    }

    private fun givenIdlingResources(vararg resources: IdlingResource) {
        whenever(registry.resources).doReturn(resources.asList())
    }

    private fun givenSdkAsyncTaskIsIdle(isIdle: Boolean) {
        whenever(uiControllerImplReflected.invokeAsyncIsIdle()).doReturn(isIdle)
        uut = IRStatusInquirer(registry, uiControllerImplReflected)
    }

    private fun givenCompatAsyncTaskIsIdle(isIdle: Boolean) {
        whenever(uiControllerImplReflected.invokeCompatIsIdle()).doReturn(isIdle)
        uut = IRStatusInquirer(registry, uiControllerImplReflected)
    }

    @Before
    fun setup() {
        registry = mock()
        uiControllerImplReflected = mock()
        uut = IRStatusInquirer(registry, uiControllerImplReflected)
    }

    @Test
    fun `should return no busy resources if there are no registered resources and no asynctasks`() {
        givenSdkAsyncTaskIsIdle(true)
        givenCompatAsyncTaskIsIdle(true)

        val result = uut.getAllBusyResources()

        assertThat(result).isEmpty()
    }

    @Test
    fun `should return busy resources if there are some`() {
        val resourceIdle = anIdleResource()
        val resourceBusy = aBusyResource()
        givenSdkAsyncTaskIsIdle(true)
        givenCompatAsyncTaskIsIdle(true)
        givenIdlingResources(resourceIdle, resourceBusy)
        val expected = listOf(DetoxBusyResource(resourceBusy))

        assertThat(uut.getAllBusyResources()).isEqualTo(expected)
    }

    @Test
    fun `should return busy resources if there are sdk asynctasks`() {
        val resourceIdle = anIdleResource()
        givenIdlingResources(resourceIdle)
        val expected = listOf(DetoxBusyResource("bg", mapOf("reason" to "asynctasks")))
        givenSdkAsyncTaskIsIdle(false)
        givenCompatAsyncTaskIsIdle(true)
        assertThat(uut.getAllBusyResources()).isEqualTo(expected)
    }

    @Test
    fun `should return busy resources if there are compat asynctasks`() {
        val resourceIdle = anIdleResource()
        givenIdlingResources(resourceIdle)
        val expected = listOf(DetoxBusyResource("bg", mapOf("reason" to "asynctasks")))
        givenSdkAsyncTaskIsIdle(true)
        givenCompatAsyncTaskIsIdle(false)
        assertThat(uut.getAllBusyResources()).isEqualTo(expected)
    }

    @Test
    fun `should return busy resources if there are both sdk and compat asynctasks`() {
        val resourceIdle = anIdleResource()
        givenIdlingResources(resourceIdle)
        val expected = listOf(DetoxBusyResource("bg", mapOf("reason" to "asynctasks")))
        givenSdkAsyncTaskIsIdle(false)
        givenCompatAsyncTaskIsIdle(false)
        assertThat(uut.getAllBusyResources()).isEqualTo(expected)
    }

    private fun createMockedDescriptiveResource(description: IdlingResourceDescription):
            DescriptiveIdlingResource {
        val resource: DescriptiveIdlingResource = mock()
        whenever(resource.getDescription()).thenReturn(description)
        return resource
    }

    @Test
    fun `should return busy app status with descriptive resource`() {
        givenSdkAsyncTaskIsIdle(true)
        givenCompatAsyncTaskIsIdle(true)

        val fakeDescription = IdlingResourceDescription.Builder()
            .name("foo")
            .addDescription("bar", "baz")
            .addDescription("qux", "quux")
            .build()

        val busyResources: List<IdlingResource> = listOf(
            createMockedDescriptiveResource(fakeDescription)
        )

        whenever(registry.resources).thenReturn(busyResources)

        val result = uut.getAllBusyResources()

        val expectedBusyResourceDescription = listOf(
            mapOf("name" to "foo", "description" to mapOf("bar" to "baz", "qux" to "quux"))
        )

        for (i in result.indices) {
            assertThat(result[i].resourceMap).isEqualTo(expectedBusyResourceDescription[i])
        }
    }

    private abstract class LooperIdlingResource: IdlingResource

    private fun createMockedLooperIdlingResource(resourceName: String): LooperIdlingResource {
        val resource: LooperIdlingResource = mock()
        whenever(resource.name).thenReturn(resourceName)
        return resource
    }

    @Test
    fun `should return busy app status with looper resources`() {
        givenSdkAsyncTaskIsIdle(true)
        givenCompatAsyncTaskIsIdle(true)

        val busyResources: List<IdlingResource> = listOf(
            createMockedLooperIdlingResource("mqt_js"),
            createMockedLooperIdlingResource("mqt_native"),
            createMockedLooperIdlingResource("unmapped")
        )

        whenever(registry.resources).thenReturn(busyResources)

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

        val result = uut.getAllBusyResources()

        for (i in result.indices) {
            assertThat(result[i].resourceMap).isEqualTo(expectedBusyResourceDescription[i])
        }
    }

    private fun createMockedIdlingResource(name: String): IdlingResource {
        val resource: IdlingResource = mock()
        whenever(resource.name).thenReturn(name)
        return resource
    }

    @Test
    fun`should return busy app status with unknown resource`() {
        givenSdkAsyncTaskIsIdle(true)
        givenCompatAsyncTaskIsIdle(true)

        val busyResources: List<IdlingResource> = listOf(
            createMockedIdlingResource( "quux")
        )
        whenever(registry.resources).thenReturn(busyResources)

        val result = uut.getAllBusyResources()

        val expectedBusyResourceDescription = listOf(
            mapOf("name" to "unknown", "description" to mapOf("identifier" to "quux"))
        )
        for (i in result.indices) {
            assertThat(result[i].resourceMap).isEqualTo(expectedBusyResourceDescription[i])
        }
    }

    @Test
    fun `should execute busy-resources inquiry on main thread`() {
        // This is tricky because we actually need to assert two things:
        // 1. Inquiry takes place on the main thread (i.e. the test-exec thread in robolectric UT's)
        // 2. getAllBusyResources() actually awaits for the execution to finish.
        // The trick, then, is to execute uut.getAllBusyResources() on a separate thread, and assert
        // the resources are queried on the main thread nonetheless + that the *final* result is a real
        // one (i.e. a non-empty list of IR's).

        val executor = Executors.newSingleThreadExecutor()
        val resource = mock<IdlingResource> {
            on { isIdleNow } doAnswer {
                assertThat(Looper.myLooper()).isEqualTo(Looper.getMainLooper()) // Assert (1)
                Thread.sleep(10) // Make more certain to fail if inquirer doesn't *wait* for the main thread exec to complete
                false
            }
        }
        givenIdlingResources(resource)
        givenSdkAsyncTaskIsIdle(true)
        givenCompatAsyncTaskIsIdle(true)

        var result: List<DetoxBusyResource>? = null
        executor.execute {
            result = uut.getAllBusyResources()
        }
        Thread.sleep(100L) // Give time for the unit to actually post on the main thread (as it's suppose to...)
        Robolectric.flushForegroundThreadScheduler()
        UTHelpers.yieldToOtherThreads(executor)
        val expected = listOf(DetoxBusyResource(resource))
        assertThat(result).isEqualTo(expected) // Assert (2)
    }
}
