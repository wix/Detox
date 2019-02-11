package com.wix.detox

import com.facebook.react.bridge.ReactContext
import com.nhaarman.mockito_kotlin.*
import com.wix.detox.UTHelpers.yieldToOtherThreads
import org.junit.Before
import org.junit.Test
import java.util.*
import java.util.concurrent.Executors

open class DetoxActionHandlerTestBase {
    val params = ""
    val messageId = 666L

    lateinit var rnContext: ReactContext
    lateinit var wsClientMock: WebSocketClient
    lateinit var testEngineFacade: TestEngineFacade

    @Before open fun setUp() {
        rnContext = mock()
        wsClientMock = mock()

        testEngineFacade = mock()
        whenever(testEngineFacade.awaitIdle()).then {
            synchronized(this) {}
        }
        whenever(testEngineFacade.syncIdle()).then {
            synchronized(this) {}
        }
    }
}

class ReadyActionHandlerTest : DetoxActionHandlerTestBase() {
    @Test fun `should reply with a 'ready' ACK if ready`() {
        uut().handle(params, messageId)
        verify(wsClientMock).sendAction(eq("ready"), eq(Collections.emptyMap<Any, Any>()), eq(messageId))
    }

    @Test fun `should block waiting for idle before ACK-ing`() {
        val executor = Executors.newSingleThreadExecutor()

        synchronized(this) {
            executor.submit {
                uut().handle(params, messageId)
            }
            yieldToOtherThreads(executor)
            verify(testEngineFacade).awaitIdle()
            verify(wsClientMock, never()).sendAction(any(), any(), any())
        }
        yieldToOtherThreads(executor)
        verify(wsClientMock, times(1)).sendAction(any(), any(), any())
    }

    private fun uut() = ReadyActionHandler(wsClientMock, testEngineFacade)
}

class ReactNativeReloadActionHandlerTest : DetoxActionHandlerTestBase() {
    @Test fun `should reload the app`() {
        uut().handle(params, messageId)
        verify(testEngineFacade).reloadReactNative(rnContext)
    }

    @Test fun `should reply with a 'ready' ACK when ready`() {
        uut().handle(params, messageId)
        verify(wsClientMock).sendAction(eq("ready"), eq(Collections.emptyMap<Any, Any>()), eq(messageId))
    }

    @Test fun `should sync before ACK-ing`() {
        val executor = Executors.newSingleThreadExecutor()

        synchronized(this) {
            executor.submit {
                uut().handle(params, messageId)
            }
            yieldToOtherThreads(executor)
            verify(testEngineFacade).syncIdle()
            verify(testEngineFacade, never()).reloadReactNative(any())
            verify(wsClientMock, never()).sendAction(any(), any(), any())
        }
        yieldToOtherThreads(executor)
        verify(testEngineFacade, times(1)).reloadReactNative(any())
        verify(wsClientMock, times(1)).sendAction(any(), any(), any())
    }

    private fun uut() = ReactNativeReloadActionHandler(rnContext, wsClientMock, testEngineFacade)
}
