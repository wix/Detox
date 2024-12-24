package com.wix.detox.reactnative.idlingresources

import androidx.test.espresso.IdlingResource
import com.facebook.react.bridge.NativeModule
import com.wix.detox.UTHelpers.yieldToOtherThreads
import com.wix.detox.reactnative.idlingresources.storage.AsyncStorageIdlingResource
import com.wix.detox.reactnative.idlingresources.storage.SerialExecutorReflected
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import java.util.concurrent.Executor
import java.util.concurrent.Executors

private class AsyncStorageModuleStub : NativeModule {
    val executor: Executor = mock(name = "native-module's executor")
    override fun getName() = "stub"
    override fun initialize() {}
    override fun canOverrideExistingModule() = false
    override fun onCatalystInstanceDestroy() {}
    override fun invalidate() {}
}

@RunWith(RobolectricTestRunner::class)
class AsyncStorageIdlingResourceTest {
    private lateinit var sexecutor: Executor
    private lateinit var sexecutorReflected: SerialExecutorReflected
    private lateinit var sexecutorReflectedGenFn: (executor: Executor) -> SerialExecutorReflected
    private lateinit var module: AsyncStorageModuleStub
    private lateinit var uut: AsyncStorageIdlingResource

    @Before
    fun setup() {
        sexecutor = mock()
        module = AsyncStorageModuleStub()
        sexecutorReflected = mock() {
            on { executor() }.thenReturn(sexecutor)
        }
        sexecutorReflectedGenFn = mock() {
            on { invoke(eq(module.executor)) }.thenReturn(sexecutorReflected)
        }


        uut = AsyncStorageIdlingResource(module, sexecutorReflectedGenFn)
    }

    fun givenNoActiveTasks() = whenever(sexecutorReflected.hasActiveTask()).thenReturn(false)
    fun givenAnActiveTask() = whenever(sexecutorReflected.hasActiveTask()).thenReturn(true)
    fun givenNoPendingTasks() = whenever(sexecutorReflected.hasPendingTasks()).thenReturn(false)
    fun givenPendingTasks() = whenever(sexecutorReflected.hasPendingTasks()).thenReturn(true)
    fun givenIdleSExecutor() {
        givenNoActiveTasks()
        givenNoPendingTasks()
    }

    fun givenBusySExecutor() {
        givenAnActiveTask()
        givenNoPendingTasks()
    }

    fun verifyNoTasksEnqueued() = verify(sexecutorReflected, never()).executeTask(any())
    fun verifyTaskEnqueuedOnce() = verify(sexecutorReflected, times(1)).executeTask(any())
    fun verifyTaskEnqueuedTwice() = verify(sexecutorReflected, times(2)).executeTask(any())

    @Test
    fun `should have a name`() {
        assertThat(uut.name).isEqualTo("com.wix.detox.reactnative.idlingresources.storage.AsyncStorageIdlingResource")
    }

    @Test
    fun `should have a debug-name`() {
        assertThat(uut.getDebugName()).isEqualTo("io")
    }

    @Test
    fun `should be idle`() {
        givenIdleSExecutor()
        assertThat(uut.isIdleNow).isTrue()
    }

    @Test
    fun `should be busy if executor is executing`() {
        givenAnActiveTask()
        givenNoPendingTasks()
        assertThat(uut.isIdleNow).isFalse()
    }

    @Test
    fun `should be busy if executor has pending tasks`() {
        givenNoActiveTasks()
        givenPendingTasks()
        assertThat(uut.isIdleNow).isFalse()
    }

    @Test
    fun `should be synchronized over actual executor`() {
        val localExecutor = Executors.newSingleThreadExecutor()
        var isIdle: Boolean? = null
        synchronized(sexecutor) {
            localExecutor.submit {
                isIdle = uut.isIdleNow
            }
            yieldToOtherThreads(localExecutor)
            assertThat(isIdle).isNull()
        }
        yieldToOtherThreads(localExecutor)
    }

    @Test
    fun `should enqueue an idle-check task if resource is busy`() {
        givenBusySExecutor()
        uut.isIdleNow
        verifyTaskEnqueuedOnce()
    }

    @Test
    fun `should not enqueue an idle-check task if resource if idle`() {
        givenIdleSExecutor()
        uut.isIdleNow
        verifyNoTasksEnqueued()
    }

    @Test
    fun `should not enqueue more than one idle-check task`() {
        givenBusySExecutor()

        repeat(2) {
            uut.isIdleNow
        }
        verifyTaskEnqueuedOnce()
    }

    private val callback: IdlingResource.ResourceCallback = mock()


    fun verifyTransitionToIdleCalled() = verify(callback).onTransitionToIdle()
    fun verifyTransitionToIdleNotCalled() = verify(callback, never()).onTransitionToIdle()

    @Test
    fun `should enqueue an idle-check task`() {
        uut.registerIdleTransitionCallback(callback)
        verifyTaskEnqueuedOnce()
    }

    @Test
    fun `callback registration - should be synchronized over actual executor`() {
        val localExecutor = Executors.newSingleThreadExecutor()

        synchronized(sexecutor) {
            localExecutor.submit {
                uut.registerIdleTransitionCallback(callback)
            }
            yieldToOtherThreads(localExecutor)
            verifyNoTasksEnqueued()
        }
        yieldToOtherThreads(localExecutor)
    }


    fun executeIdleCheckTask() {
        argumentCaptor<Runnable>().also {
            verify(sexecutorReflected).executeTask(it.capture())
        }.firstValue.run()
    }

    @Test
    fun `should transition to idle`() {
        givenIdleSExecutor()

        uut.registerIdleTransitionCallback(callback)
        executeIdleCheckTask()

        verifyTransitionToIdleCalled()
    }

    @Test
    fun `should not transition to idle if busy`() {
        givenAnActiveTask()
        givenPendingTasks()

        uut.registerIdleTransitionCallback(callback)
        executeIdleCheckTask()

        verifyTransitionToIdleNotCalled()
    }

    @Test
    fun `should not inspect sexecutor for activity, because it runs on the executor itself`() {
        givenAnActiveTask()
        givenPendingTasks()

        uut.registerIdleTransitionCallback(callback)
        executeIdleCheckTask()

        verify(sexecutorReflected, never()).hasActiveTask()
    }

    @Test
    fun `should reenqueue if still busy`() {
        givenAnActiveTask()
        givenPendingTasks()

        uut.registerIdleTransitionCallback(callback)
        executeIdleCheckTask()

        verifyTaskEnqueuedTwice()
    }

    @Test
    fun `should be synchronized`() {
        val localExecutor = Executors.newSingleThreadExecutor()

        givenIdleSExecutor()
        uut.registerIdleTransitionCallback(callback)

        synchronized(sexecutor) {
            localExecutor.submit {
                executeIdleCheckTask()
            }
            yieldToOtherThreads(localExecutor)
            verifyTransitionToIdleNotCalled()
        }
        yieldToOtherThreads(localExecutor)
    }


    @Test
    fun `should allow for an enqueuing of more tasks after idle-transition`() {
        uut.registerIdleTransitionCallback(callback)

        givenIdleSExecutor()
        executeIdleCheckTask()

        givenBusySExecutor()
        uut.isIdleNow

        verifyTaskEnqueuedTwice()
    }
}
