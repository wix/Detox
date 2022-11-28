package com.wix.detox.espresso.asynctasks

import com.wix.detox.reactnative.idlingresources.asynctask.DetoxBusyResource
import com.wix.detox.reactnative.idlingresources.asynctask.UiControllerImplReflected
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class AsyncTaskInquirerTest {
    private lateinit var uut: AsyncTaskInquirer
    private lateinit var uiControllerImplReflected: UiControllerImplReflected

    private val expected = DetoxBusyResource("bg", "asynctasks")

    @Before
    fun setup() {
        uiControllerImplReflected = mock()
        uut = AsyncTaskInquirer(uiControllerImplReflected)
    }

    @Test
    fun `should return null if there are no busy asynctasks`() {
        givenSdkAsyncTaskIsIdle(true)
        givenCompatAsyncTaskIsIdle(true)
        assertThat(uut.getBusyAsyncTasks()).isNull()
    }

    @Test
    fun `should return busy resources if there are busy sdk asynctasks`() {
        givenSdkAsyncTaskIsIdle(false)
        givenCompatAsyncTaskIsIdle(true)
        assertThat(uut.getBusyAsyncTasks()).isEqualTo(expected)
    }

    @Test
    fun `should return busy resources if there are busy compat asynctasks`() {
        givenSdkAsyncTaskIsIdle(true)
        givenCompatAsyncTaskIsIdle(false)
        assertThat(uut.getBusyAsyncTasks()).isEqualTo(expected)
    }

    @Test
    fun `should return busy resources if there are both busy sdk and compat asynctasks`() {
        givenSdkAsyncTaskIsIdle(false)
        givenCompatAsyncTaskIsIdle(false)
        assertThat(uut.getBusyAsyncTasks()).isEqualTo(expected)
    }

    private fun givenSdkAsyncTaskIsIdle(isIdle: Boolean) {
        whenever(uiControllerImplReflected.invokeAsyncIsIdle()).doReturn(isIdle)
        uut = AsyncTaskInquirer(uiControllerImplReflected)
    }

    private fun givenCompatAsyncTaskIsIdle(isIdle: Boolean) {
        whenever(uiControllerImplReflected.invokeCompatIsIdle()).doReturn(isIdle)
        uut = AsyncTaskInquirer(uiControllerImplReflected)
    }
}