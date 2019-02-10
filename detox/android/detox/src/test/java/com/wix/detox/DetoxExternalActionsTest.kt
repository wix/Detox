package com.wix.detox

import com.nhaarman.mockito_kotlin.*
import org.junit.Before
import org.junit.Test
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

class ReadyActionTest {

    val params = ""
    val messageId = 666L

    lateinit var wsClientMock: WebSocketClient
    lateinit var testHelpers: TestHelper

    @Before fun setUp() {
        wsClientMock = mock()
        testHelpers = mock()
    }

    @Test fun `should reply with a 'ready' ACK if ready`() {
        uut().perform(params, messageId)

        verify(wsClientMock).sendAction(eq("ready"), eq(Collections.emptyMap<Any, Any>()), eq(messageId))
    }

    @Test fun `should block waiting for idle before ACK-ing`() {
        val executor = Executors.newSingleThreadExecutor()
        val lock = object {}

        whenever(testHelpers.awaitIdle()).then {
            synchronized(lock) {}
        }

        synchronized(lock) {
            executor.submit {
                uut().perform(params, messageId)
            }
            yieldToOtherThreads(executor)
            verify(wsClientMock, never()).sendAction(any(), any(), any())
        }
        yieldToOtherThreads(executor)
        verify(wsClientMock, times(1)).sendAction(any(), any(), any())
    }

    private fun uut() = ReadyAction(wsClientMock, testHelpers)

    private fun yieldToOtherThreads(executor: ExecutorService) = executor.awaitTermination(100L, TimeUnit.MILLISECONDS)
}
