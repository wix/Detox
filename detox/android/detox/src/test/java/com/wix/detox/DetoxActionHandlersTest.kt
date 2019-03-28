package com.wix.detox

import androidx.test.espresso.IdlingResource
import com.facebook.react.bridge.ReactContext
import com.nhaarman.mockito_kotlin.*
import com.wix.detox.UTHelpers.yieldToOtherThreads
import com.wix.invoke.MethodInvocation
import org.assertj.core.api.Assertions.assertThat
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Before
import org.junit.Test
import java.util.*
import java.util.concurrent.Executors
import java.lang.reflect.InvocationTargetException

open class DetoxActionHandlerTestBase {
    val params = "{\"mock\": \"params\"}"
    val messageId = 666L

    lateinit var rnContext: ReactContext
    lateinit var wsClient: WebSocketClient
    lateinit var testEngineFacade: TestEngineFacade

    @Before open fun setUp() {
        rnContext = mock()
        wsClient = mock()

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
        verify(wsClient).sendAction(eq("ready"), eq(Collections.emptyMap<Any, Any>()), eq(messageId))
    }

    @Test fun `should block waiting for idle before ACK-ing`() {
        val executor = Executors.newSingleThreadExecutor()

        synchronized(this) {
            executor.submit {
                uut().handle(params, messageId)
            }
            yieldToOtherThreads(executor)
            verify(testEngineFacade).awaitIdle()
            verify(wsClient, never()).sendAction(any(), any(), any())
        }
        yieldToOtherThreads(executor)
        verify(wsClient, times(1)).sendAction(any(), any(), any())
    }

    private fun uut() = ReadyActionHandler(wsClient, testEngineFacade)
}

class ReactNativeReloadActionHandlerTest : DetoxActionHandlerTestBase() {
    @Test fun `should reload the app`() {
        uut().handle(params, messageId)
        verify(testEngineFacade).reloadReactNative(rnContext)
    }

    @Test fun `should reply with a 'ready' ACK when ready`() {
        uut().handle(params, messageId)
        verify(wsClient).sendAction(eq("ready"), eq(emptyMap<Any, Any>()), eq(messageId))
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
            verify(wsClient, never()).sendAction(any(), any(), any())
        }
        yieldToOtherThreads(executor)
        verify(testEngineFacade, times(1)).reloadReactNative(any())
        verify(wsClient, times(1)).sendAction(any(), any(), any())
    }

    private fun uut() = ReactNativeReloadActionHandler(rnContext, wsClient, testEngineFacade)
}

class InvokeActionHandlerTest : DetoxActionHandlerTestBase() {
    lateinit var methodInvocationMock: MethodInvocation

    @Before override fun setUp() {
        super.setUp()
        methodInvocationMock = mock()
    }

    @Test fun `should invoke the right target`() {
        uut().handle(params, messageId)
        verify(methodInvocationMock).invoke(params)
    }

    @Test fun `should reply with an 'invokeResult' ACK`() {
        uut().handle(params, messageId)
        verify(wsClient).sendAction(eq("invokeResult"), any(), eq(messageId))
    }

    // TODO reply with an actual result
    @Test fun `should reply with dummy result data`() {
        uut().handle(params, messageId)

        verify(wsClient).sendAction(any(), argThat { size == 1 && this["result"] == "(null)" }, any())
    }

    @Test fun `should handle runtime errors`() {
        whenever(methodInvocationMock.invoke(isA<String>())).thenThrow(IllegalStateException("mock-error-reason"))
        uut().handle(params, messageId)

        verify(wsClient).sendAction(
                eq("testFailed"),
                argThat { size == 1 && this["details"] == "mock-error-reason" },
                eq(messageId))
    }

    @Test fun `should handle an InvocationTargetException`() {
        val exception = InvocationTargetException(Exception("mock-error-reason"))
        whenever(methodInvocationMock.invoke(isA<String>())).thenThrow(exception)

        uut().handle(params, messageId)

        verify(wsClient).sendAction(
                eq("error"),
                argThat { size == 1 && this["error"] == "mock-error-reason" },
                eq(messageId))
    }

    private fun uut() = InvokeActionHandler(methodInvocationMock, wsClient)
}

class CleanupActionHandlerTest : DetoxActionHandlerTestBase() {

    private var doStopDetoxLambda: (() -> Unit)? = null

    @Before override fun setUp() {
        super.setUp()
        doStopDetoxLambda = mock()
    }

    @Test fun `should reply with a 'cleanupDone' ACK`() {
        uut().handle(params, messageId)
        verify(wsClient).sendAction(eq("cleanupDone"), eq(emptyMap<Any, Any>()), eq(messageId))
    }

    @Test fun `should hard-reset RN`() {
        uut().handle(params, messageId)
        verify(testEngineFacade).hardResetReactNative(rnContext)
    }

    @Test fun `should not stop all of detox`() {
        uut().handle(params, messageId)
        verify(doStopDetoxLambda!!, never()).invoke()
    }

    @Test fun `with stopRunner arg, should stop all of detox via lambda`() {
        uut().handle("{\"stopRunner\": true}", messageId)
        verify(doStopDetoxLambda!!).invoke()
    }

    @Test fun `with stopRunner arg, should only soft reset (assuming lambda call with take care of it later)`() {
        uut().handle("{\"stopRunner\": true}", messageId)
        verify(testEngineFacade, times(1)).softResetReactNative()
        verify(testEngineFacade, never()).hardResetReactNative(rnContext)
    }

    private fun uut() = CleanupActionHandler(rnContext, wsClient, testEngineFacade, doStopDetoxLambda!!)
}

class QueryStatusActionHandlerTest : DetoxActionHandlerTestBase() {
    @Test fun `should reply with an 'idle' if there are no busy idling resources`() {
        withBusyResources(emptyList())

        uut().handle(params, messageId)

        verify(wsClient).sendAction(eq("currentStatusResult"), argThat { size == 1 && this["state"] == "idle" }, eq(messageId))
    }

    @Test fun `should reply with a 'busy' if there's at least one busy resource`() {
        val idleResource = anIdlingResource("mockResource")
        withBusyResources(listOf(idleResource))

        uut().handle(params, messageId)

        verify(wsClient).sendAction(eq("currentStatusResult"), argThat { size == 2 && this["state"] == "busy" }, eq(messageId))
    }

    @Test fun `should reply with a description of a busy resource`() {
        val idleResources = anIdlingResource("mockResource")
        withBusyResources(listOf(idleResources))

        uut().handle(params, messageId)

        argumentCaptor<Map<String, Any?>>().apply {
            verify(wsClient).sendAction(any(), capture(), any())

            val data = this.lastValue
            assertThat(data["resources"]).isInstanceOf(JSONArray::class.java)

            val resourcesArray = data["resources"] as JSONArray
            assertThat(resourcesArray.length()).isEqualTo(1)
            assertThat(resourcesArray.get(0)).isInstanceOf(JSONObject::class.java)

            val idleResourceData = resourcesArray.get(0) as JSONObject
            assertThat(idleResourceData.get("name")).isEqualTo(idleResources.javaClass.simpleName)
            assertThat(idleResourceData.get("info")).isInstanceOf(JSONObject::class.java)
            assertThat((idleResourceData.get("info") as JSONObject).get("prettyPrint")).isEqualTo("mockResource.name")
        }
    }

    @Test fun `should reply with a description of multiple busy resources`() {
        val idleResource1 = anIdlingResource("mockResource1")
        val idleResource2 = anIdlingResource("mockResource2")
        withBusyResources(listOf(idleResource1, idleResource2))

        uut().handle(params, messageId)

        argumentCaptor<Map<String, Any?>>().apply {
            verify(wsClient).sendAction(any(), capture(), any())

            val data = this.lastValue
            val resourcesArray = data["resources"] as JSONArray
            assertThat(resourcesArray.length()).isEqualTo(2)
        }
    }

    private fun uut() = QueryStatusActionHandler(wsClient, testEngineFacade)

    private fun anIdlingResource(resourceName: String): IdlingResource =
            mock(name = resourceName) {
                on { name } doReturn("$resourceName.name")
            }

    private fun withBusyResources(resources: List<IdlingResource>) {
        whenever(testEngineFacade.getBusyIdlingResources()).doReturn(listOf(resources))
    }
}
