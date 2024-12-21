package com.wix.detox.reactnative.idlingresources

import com.wix.detox.reactnative.idlingresources.storage.SerialExecutorReflected
import org.assertj.core.api.Assertions.assertThat
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe
import java.util.concurrent.Executor


private class SerialExecutorStub(private val executeFn: (r: Runnable) -> Unit): Executor {
    val mTasks = mutableListOf<Any>()
    var mActive: Runnable? = null

    override fun execute(r: Runnable) = executeFn(r)
}

object SerialExecutorReflectedSpec : Spek({
    describe("Serial-executor") {
        lateinit var serialExecutor: SerialExecutorStub
        lateinit var uut: SerialExecutorReflected
        lateinit var executeFn: (r: Runnable) -> Unit

        beforeEachTest {
            executeFn = mock()
            serialExecutor = SerialExecutorStub(executeFn)
            uut = SerialExecutorReflected(serialExecutor)
        }

        it("should query pending tasks on empty executor") {
            assertThat(uut.hasPendingTasks()).isFalse()
        }

        it("should query pending tasks on an executor with pending jobs") {
            serialExecutor.mTasks.add("Task#1")
            assertThat(uut.hasPendingTasks()).isTrue()
        }

        it("should query active task on an empty executor") {
            assertThat(uut.hasActiveTask()).isFalse()
        }

        it("should query active task on a busy executor") {
            serialExecutor.mActive = Runnable {  }
            assertThat(uut.hasActiveTask()).isTrue()
        }

        it("should execute tasks over the reflected executor") {
            val runnable = Runnable { }
            uut.executeTask(runnable)
            verify(executeFn).invoke(runnable)
        }

        it("should return the real executor") {
            assertThat(uut.executor()).isEqualTo(serialExecutor)
        }
    }
})
