package com.wix.detox

import com.facebook.react.bridge.ReactContext
import com.nhaarman.mockitokotlin2.*
import com.wix.detox.UTHelpers.yieldToOtherThreads
import com.wix.invoke.MethodInvocation
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe
import java.lang.reflect.InvocationTargetException
import java.util.*
import java.util.concurrent.Executors

object DetoxActionHandlersSpec: Spek({
    describe("Action handlers") {
        val params = "{\"mock\": \"params\"}"
        val messageId = 666L

        lateinit var rnContext: ReactContext
        lateinit var wsClient: WebSocketClient
        lateinit var testEngineFacade: TestEngineFacade

        beforeEachTest {
            rnContext = mock()
            wsClient = mock()

            testEngineFacade = mock()
            whenever(testEngineFacade.awaitIdle()).then {
                synchronized(testEngineFacade) {}
            }
            whenever(testEngineFacade.syncIdle()).then {
                synchronized(testEngineFacade) {}
            }
        }

        describe("Ready action") {
            fun uut() = ReadyActionHandler(wsClient, testEngineFacade)

            it("should reply with a 'ready' ACK if ready") {
                uut().handle(params, messageId)
                verify(wsClient).sendAction(eq("ready"), eq(Collections.emptyMap<Any, Any>()), eq(messageId))
            }

            it("should block waiting for idle before ACK-ing") {
                val executor = Executors.newSingleThreadExecutor()

                synchronized(testEngineFacade) {
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
        }

        describe("React-native reload action") {
            fun uut() = ReactNativeReloadActionHandler(rnContext, wsClient, testEngineFacade)

            it("should reload the app") {
                uut().handle(params, messageId)
                verify(testEngineFacade).reloadReactNative(rnContext)
            }

            it("should reply with a 'ready' ACK when ready") {
                uut().handle(params, messageId)
                verify(wsClient).sendAction(eq("ready"), eq(emptyMap<Any, Any>()), eq(messageId))
            }

            it("should sync before ACK-ing") {
                val executor = Executors.newSingleThreadExecutor()

                synchronized(testEngineFacade) {
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
        }

        describe("Invoke actions") {
            lateinit var methodInvocationMock: MethodInvocation

            fun uut() = InvokeActionHandler(methodInvocationMock, wsClient)

            beforeEachTest {
                methodInvocationMock = mock()
            }

            it("should invoke the right target") {
                uut().handle(params, messageId)
                verify(methodInvocationMock).invoke(params)
            }

            it("should reply with an 'invokeResult' ACK") {
                uut().handle(params, messageId)
                verify(wsClient).sendAction(eq("invokeResult"), any(), eq(messageId))
            }

            // TODO reply with an actual result
            it("should reply with dummy result data") {
                uut().handle(params, messageId)

                verify(wsClient).sendAction(any(), argThat { size == 1 && this["result"] == "(null)" }, any())
            }

            it("should handle runtime errors") {
                whenever(methodInvocationMock.invoke(isA<String>())).thenThrow(IllegalStateException("mock-error-reason"))
                uut().handle(params, messageId)

                verify(wsClient).sendAction(
                        eq("testFailed"),
                        argThat { size == 1 && this["details"] == "mock-error-reason" },
                        eq(messageId))
            }

            it("should handle an InvocationTargetException") {
                val exception = InvocationTargetException(Exception("mock-error-reason"))
                whenever(methodInvocationMock.invoke(isA<String>())).thenThrow(exception)

                uut().handle(params, messageId)

                verify(wsClient).sendAction(
                        eq("error"),
                        argThat { size == 1 && this["error"] == "mock-error-reason" },
                        eq(messageId))
            }
        }
    }
})
