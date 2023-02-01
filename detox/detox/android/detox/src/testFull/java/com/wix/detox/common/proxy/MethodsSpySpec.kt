package com.wix.detox.common.proxy

import org.assertj.core.api.Assertions.assertThat
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe
import java.util.*

object MethodsSpySpec: Spek({
    describe("Method-calls spy") {

        val defaultMethodName = "mockMethod"

        lateinit var uut: MethodsSpy

        beforeEachTest {
            uut = MethodsSpy("uut")
        }

        fun assertHistory(methodName: String = defaultMethodName): Queue<CallInfo> {
            val history = uut.getHistory(methodName)
            assertThat(history).isNotNull
            return history!!
        }

        fun triggerOpenMethodCall(methodName: String = defaultMethodName) {
            uut.onBeforeCall(methodName)
        }

        fun triggerMethodCall(methodName: String = defaultMethodName) {
            uut.onBeforeCall(methodName)
            uut.onAfterCall(methodName)
        }

        fun assertMethodCall(callInfo: CallInfo?, expectedInTimeAbove: Long, expectedOutTimeAbove: Long) {
            assertThat(callInfo).isNotNull
            assertThat(callInfo!!.inTime).isGreaterThanOrEqualTo(expectedInTimeAbove)
            assertThat(callInfo!!.outTime).isGreaterThanOrEqualTo(expectedOutTimeAbove)
        }

        fun assertMethodCallOpen(callInfo: CallInfo?, expectedInTimeAbove: Long) {
            assertThat(callInfo).isNotNull
            assertThat(callInfo!!.inTime).isGreaterThanOrEqualTo(expectedInTimeAbove)
            assertThat(callInfo!!.outTime).isNull()
        }

        fun assertLastMethodCallOpen(methodName: String = defaultMethodName, expectedInTimeAbove: Long) {
            val history = assertHistory(methodName)
            assertMethodCallOpen(history.peek(), expectedInTimeAbove)
        }

        fun assertLastMethodCall(methodName: String = defaultMethodName, expectedInTimeAbove: Long, expectedOutTimeAbove: Long) {
            val history = assertHistory(methodName)
            assertMethodCall(history.peek(), expectedInTimeAbove, expectedOutTimeAbove)
        }

        fun assertCollectedCallCount(methodName: String = defaultMethodName, count: Int) {
            val history = assertHistory(methodName)
            assertThat(history.size).isEqualTo(count)
        }

        it("should handle an empty spy") {
            assertThat(uut.getHistory("nonExistMethod")).isNull()
        }

        it("should spy on a method call, before calling it") {
            val beforeTimeRef = System.currentTimeMillis()

            uut.start()
            triggerOpenMethodCall()

            assertLastMethodCallOpen(expectedInTimeAbove = beforeTimeRef)
        }

        it("should spy on a method call, after call completes") {
            val beforeTimeRef = System.currentTimeMillis()
            val afterTimeRef = System.currentTimeMillis()

            uut.start()
            triggerMethodCall()

            assertLastMethodCall(expectedInTimeAbove =  beforeTimeRef, expectedOutTimeAbove = afterTimeRef)
        }

        it("should spy on multiple calls, in order of: lower-index <=> newer-call") {
            uut.start()

            val timeRef1 = System.currentTimeMillis()
            triggerMethodCall()

            Thread.sleep(100)

            val timeRef2 = System.currentTimeMillis()
            triggerMethodCall()

            val history = assertHistory()
            assertCollectedCallCount(count = 2)
            assertMethodCall(history.elementAt(0), timeRef2, timeRef2)
            assertMethodCall(history.elementAt(1), timeRef1, timeRef1)
        }

        it("should not spy if stopped") {
            uut.start()
            triggerMethodCall()

            uut.stop()
            triggerMethodCall()

            assertCollectedCallCount(count = 1)
        }

        it("should resume spying") {
            triggerMethodCall()

            uut.start()
            triggerMethodCall()
            assertCollectedCallCount(count = 1)
        }

        it("should reset calls when started") {
            uut.start()
            triggerMethodCall()
            triggerMethodCall()
            uut.stop()

            uut.start()
            triggerMethodCall()
            assertCollectedCallCount(count = 1)
        }

        it("should spy methods distinctively") {
            uut.start()
            triggerMethodCall("method1")
            triggerMethodCall("method2")
            triggerMethodCall("method2")
            uut.stop()

            assertCollectedCallCount("method1", 1)
            assertCollectedCallCount("method2", 2)
        }

        it("should allow for simple delta-time calculation") {
            uut.start()
            triggerMethodCall()
            Thread.sleep(10)
            triggerMethodCall()

            val history = assertHistory()
            val newerCall = history.elementAt(0)
            val olderCall = history.elementAt(1)
            val delta = newerCall - olderCall
            assertThat(delta).isGreaterThanOrEqualTo(10)
        }
    }
})
