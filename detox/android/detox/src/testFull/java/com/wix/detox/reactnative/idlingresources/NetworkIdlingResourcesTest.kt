package com.wix.detox.reactnative.idlingresources

import com.wix.detox.UTHelpers.yieldToOtherThreads
import org.assertj.core.api.Assertions.assertThat

import okhttp3.Dispatcher
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.util.concurrent.Executors

@RunWith(RobolectricTestRunner::class)
class NetworkIdlingResourcesTest {
    lateinit var dispatcher: Dispatcher
    lateinit var uut: NetworkIdlingResource

    @Before
    fun setup() {
        dispatcher = Dispatcher()
        uut = NetworkIdlingResource(dispatcher)
    }

    // Note: Ideally, we should test that the list of busy resources is protected,
    // rather than testing thread-safety as a whole.
    @Test
    fun `should return the description in a thread-safe way`() {
        val localExecutor = Executors.newSingleThreadExecutor()
        var description: IdlingResourceDescription? = null

        synchronized(uut) {
            localExecutor.submit {
                description = uut.getDescription()
            }

            yieldToOtherThreads(localExecutor)
            assertThat(description).isNull()
        }
        yieldToOtherThreads(localExecutor)
        assertThat(description).isNotNull()
    }

    // Note: Ideally, we should test that the list of busy resources is protected,
    // rather than testing thread-safety as a whole.
    @Test
    fun `should check for idle in a thread-safe way`() {
        val localExecutor = Executors.newSingleThreadExecutor()
        var idle = false

        synchronized(uut) {
            localExecutor.submit {
                idle = uut.isIdleNow
            }

            yieldToOtherThreads(localExecutor)
            assertThat(idle).isFalse
        }
        yieldToOtherThreads(localExecutor)
        assertThat(idle).isTrue
    }
}
