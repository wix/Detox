package com.wix.detox.reactnative.idlingresources.storage

import org.joor.Reflect
import java.util.concurrent.Executor

class SerialExecutorReflected(executor: Any) {
    private val reflected = Reflect.on(executor)

    fun hasPendingTasks(): Boolean = pendingTasks().isNotEmpty()
    fun hasActiveTask(): Boolean = (activeTask() != null)
    fun executeTask(runnable: Runnable) = executor().execute(runnable)
    fun executor(): Executor = reflected.get()

    private fun pendingTasks() = reflected.field("mTasks").get<Collection<Any>>()
    private fun activeTask() = reflected.field("mActive").get<Runnable?>()
}
