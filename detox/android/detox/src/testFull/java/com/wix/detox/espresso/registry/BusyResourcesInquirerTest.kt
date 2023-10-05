package com.wix.detox.espresso.registry

import android.os.Looper
import androidx.test.espresso.IdlingResource
import androidx.test.espresso.base.IdlingResourceRegistry
import com.wix.detox.UTHelpers
import com.wix.detox.espresso.common.UiControllerImplReflected
import com.wix.detox.inquiry.DetoxBusyResource
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
class BusyResourcesInquirerTest {

    lateinit var registry: IdlingResourceRegistry
    lateinit var uiController: UiControllerImplReflected
    lateinit var uut: BusyResourcesInquirer

    private fun anIdleResource() = mock<IdlingResource> {
        on { isIdleNow } doReturn true
    }

    private fun aBusyResource() = mock<IdlingResource> {
        on { isIdleNow } doReturn false
    }

    private fun givenIdlingResources(vararg resources: IdlingResource) {
        whenever(registry.resources).doReturn(resources.asList())
    }

    private fun givenRunningAsyncTasks() {
        whenever(uiController.isAsyncIdleNow()).doReturn(false)
    }

    private fun givenRunningCompatAsyncTasks() {
        whenever(uiController.isCompatIdleNow()).doReturn(false)
    }

    @Before
    fun setup() {
        registry = mock()
        uiController = mock() {
            on { isAsyncIdleNow() } doReturn true
            on { isCompatIdleNow() } doReturn true
        }
        uut = BusyResourcesInquirer(registry, uiController)
    }

    @Test
    fun `should return no busy resources if there are no registered resources`() {
        val result = uut.getAllBusyResources()
        assertThat(result).isEmpty()
    }

    @Test
    fun `should return busy resources if there are some IR ones`() {
        val resourceIdle = anIdleResource()
        val resourceBusy = aBusyResource()
        givenIdlingResources(resourceIdle, resourceBusy)

        val result = uut.getAllBusyResources()
        assertThat(result.size).isEqualTo(1)
        assertThat(result[0] is DetoxBusyResource.BusyIdlingResource)
        assertThat((result[0] as DetoxBusyResource.BusyIdlingResource).resource).isEqualTo(resourceBusy)
    }

    @Test
    fun `should return the async-task busy resource if some async-tasks are running`() {
        givenRunningAsyncTasks()

        val result = uut.getAllBusyResources()
        assertThat(result.size).isEqualTo(1)
        assertThat(result[0] is DetoxBusyResource.BusyAsyncTasks)
    }

    @Test
    fun `should return the async-task busy resource if some legacy async-tasks are running`() {
        givenRunningCompatAsyncTasks()

        val result = uut.getAllBusyResources()
        assertThat(result.size).isEqualTo(1)
        assertThat(result[0] is DetoxBusyResource.BusyAsyncTasks)
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

        var result: List<DetoxBusyResource>? = null
        executor.execute {
            result = uut.getAllBusyResources()
        }
        Thread.sleep(100L) // Give time for the unit to actually post on the main thread (as it's suppose to...)
        Robolectric.flushForegroundThreadScheduler()
        UTHelpers.yieldToOtherThreads(executor)

        assertThat(result).isNotNull
        assertThat(result!!.size).isEqualTo(1)
        assertThat(result!![0] is DetoxBusyResource.BusyIdlingResource)
        assertThat((result!![0] as DetoxBusyResource.BusyIdlingResource).resource).isEqualTo(resource)
    }
}
