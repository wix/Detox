package com.wix.detox.espresso.registry

import android.os.Looper
import androidx.test.espresso.IdlingResource
import androidx.test.espresso.base.IdlingResourceRegistry
import com.nhaarman.mockitokotlin2.doAnswer
import com.nhaarman.mockitokotlin2.doReturn
import com.nhaarman.mockitokotlin2.mock
import com.nhaarman.mockitokotlin2.whenever
import com.wix.detox.UTHelpers
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import java.util.concurrent.*

@RunWith(RobolectricTestRunner::class)
class IRStatusInquirerTest {

    lateinit var registry: IdlingResourceRegistry
    lateinit var uut: IRStatusInquirer

    private fun anIdleResource() = mock<IdlingResource> {
        on { isIdleNow } doReturn true
    }

    private fun aBusyResource() = mock<IdlingResource> {
        on { isIdleNow } doReturn false
    }

    private fun givenIdlingResources(vararg resources: IdlingResource) {
        whenever(registry.resources).doReturn(resources.asList())
    }

    @Before
    fun setup() {
        registry = mock()
        uut = IRStatusInquirer(registry)
    }

    @Test
    fun `should return no busy resources if there are no registered resources`() {
        val result = uut.getAllBusyResources()
        assertThat(result).isEmpty()
    }

    @Test
    fun `should return busy resources if there are some`() {
        val resourceIdle = anIdleResource()
        val resourceBusy = aBusyResource()
        givenIdlingResources(resourceIdle, resourceBusy)

        val result = uut.getAllBusyResources()
        assertThat(result).isEqualTo(arrayListOf(resourceBusy))
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

        var result: List<IdlingResource>? = null
        executor.execute {
            result = uut.getAllBusyResources()
        }
        Thread.sleep(100L) // Give time for the unit to actually post on the main thread (as it's suppose to...)
        Robolectric.flushForegroundThreadScheduler()
        UTHelpers.yieldToOtherThreads(executor)
        assertThat(result).isEqualTo(arrayListOf(resource)) // Assert (2)
    }
}
