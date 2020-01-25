package com.wix.detox

import android.content.Context
import com.nhaarman.mockitokotlin2.*
import com.wix.detox.UTHelpers.yieldToOtherThreads
import com.wix.detox.instruments.DetoxInstrumentsException
import com.wix.detox.instruments.DetoxInstrumentsManager
import com.wix.invoke.MethodInvocation
import org.assertj.core.api.Assertions
import org.json.JSONObject
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe
import java.lang.reflect.InvocationTargetException
import java.util.*
import java.util.concurrent.Executors

object DetoxActionHandlersSpec : Spek({
    describe("Action handlers") {
        val params = "{\"mock\": \"params\"}"
        val messageId = 666L

        lateinit var appContext: Context
        lateinit var wsClient: WebSocketClient
        lateinit var testEngineFacade: TestEngineFacade

        beforeEachTest {
            appContext = mock()
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
            fun uut() = ReactNativeReloadActionHandler(appContext, wsClient, testEngineFacade)

            it("should reload the app") {
                uut().handle(params, messageId)
                verify(testEngineFacade).reloadReactNative(appContext)
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
                verify(testEngineFacade, times(1)).reloadReactNative(eq(appContext))
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

            it("should reply with empty result data") {
                uut().handle(params, messageId)

                verify(wsClient).sendAction(any(), argThat { size == 1 && this["result"] == null }, any())
            }

            it("should reply with actual result data") {
                val someResult = "some_result"
                whenever(methodInvocationMock.invoke(isA<String>())).thenReturn(someResult)
                uut().handle(params, messageId)

                verify(wsClient).sendAction(any(), argThat { size == 1 && this["result"] == someResult }, any())
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

        describe("InstrumentsRecording recording state actions") {
            lateinit var instrumentsManager: DetoxInstrumentsManager

            fun uut() = InstrumentsRecordingStateActionHandler(instrumentsManager, wsClient)

            beforeEachTest {
                instrumentsManager = mock()
            }

            it("should start recording with path") {
                uut().handle("{\"recordingPath\":\"/MockPath\"}", messageId)
                verify(instrumentsManager).startRecordingAtLocalPath(eq("/MockPath"))
            }

            it("should stop recording without path") {
                uut().handle("{\"recordingPath\":null}", messageId)
                verify(instrumentsManager).stopRecording()
            }

            it("should reply with a 'done' ACK on set state finish") {
                uut().handle(params, messageId)
                verify(wsClient).sendAction(eq("setRecordingStateDone"), any(), eq(messageId))
            }
        }

        describe("InstrumentsRecording events actions") {
            lateinit var instrumentsManager: DetoxInstrumentsManager
            val mockCategory = "MockCategory"
            val mockName = "MockName"
            val mockId = "MockId"
            val mockAdditionalInfo = "MockAdditionalInfo"
            val mockStatus = "MockStatus"

            fun uut() = InstrumentsEventsActionsHandler(instrumentsManager, wsClient)

            beforeEachTest {
                instrumentsManager = mock()
            }

            describe("begin interval") {
                val json = with(JSONObject()) {
                    put("category", mockCategory)
                    put("name", mockName)
                    put("id", mockId)
                    put("additionalInfo", mockAdditionalInfo)
                    put("action", "begin")
                }.toString()

                it("should invoke instrumentation") {
                    uut().handle(json, messageId)
                    verify(instrumentsManager).eventBeginInterval(
                            eq(mockCategory),
                            eq(mockName),
                            eq(mockId),
                            eq(mockAdditionalInfo)
                    )
                }

                it("should reply with a 'done' ACK") {
                    uut().handle(json, messageId)
                    verify(wsClient).sendAction(eq("eventDone"), any(), eq(messageId))
                }
            }

            describe("end interval") {
                val json = with(JSONObject()) {
                    put("id", mockId)
                    put("status", mockStatus)
                    put("additionalInfo", mockAdditionalInfo)
                    put("action", "end")
                }.toString()

                it("should invoke instrumentation") {
                    uut().handle(json, messageId)
                    verify(instrumentsManager).eventEndInterval(
                            eq(mockId),
                            eq(mockStatus),
                            eq(mockAdditionalInfo)
                    )
                }

                it("should reply with a 'done' ACK") {
                    uut().handle(json, messageId)
                    verify(wsClient).sendAction(eq("eventDone"), any(), eq(messageId))
                }
            }

            describe("mark") {
                val json = with(JSONObject()) {
                    put("category", mockCategory)
                    put("name", mockName)
                    put("id", mockId)
                    put("status", mockStatus)
                    put("additionalInfo", mockAdditionalInfo)
                    put("action", "mark")
                }.toString()

                it("should invoke instrumentation") {
                    uut().handle(json, messageId)
                    verify(instrumentsManager).eventMark(
                            eq(mockCategory),
                            eq(mockName),
                            eq(mockId),
                            eq(mockStatus),
                            eq(mockAdditionalInfo)
                    )
                }

                it("should reply with a 'done' ACK") {
                    uut().handle(json, messageId)
                    verify(wsClient).sendAction(eq("eventDone"), any(), eq(messageId))
                }
            }

            it("wrong event action") {
                val json = with(JSONObject()) {
                    put("action", "wrong")
                }.toString()

                var err: Exception? = null
                try {
                    uut().handle(json, messageId)
                } catch (e: DetoxInstrumentsException) {
                    err = e
                }
                Assertions.assertThat(err).isNotNull()
                Assertions.assertThat(err).hasMessage("Invalid action")
            }
        }
    }
})
