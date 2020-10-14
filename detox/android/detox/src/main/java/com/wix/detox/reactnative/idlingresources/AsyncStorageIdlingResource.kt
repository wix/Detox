package com.wix.detox.reactnative.idlingresources

import android.util.Log
import androidx.test.espresso.IdlingResource
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactContext
import com.wix.detox.Detox
import com.wix.detox.reactnative.helpers.RNHelpers
import org.joor.Reflect
import java.util.concurrent.Executor

private typealias SExecutorReflectedGenFnType = (executor: Executor) -> SerialExecutorReflected
private val defaultSExecutorReflectedGenFn: SExecutorReflectedGenFnType = { executor: Executor -> SerialExecutorReflected(executor) }

private class ModuleReflected(module: NativeModule, sexecutorReflectedGen: SExecutorReflectedGenFnType) {
    private val executorReflected: SerialExecutorReflected

    init {
        val reflected = Reflect.on(module)
        val executor: Executor = reflected.field("executor").get()
        executorReflected = sexecutorReflectedGen(executor)
    }

    val sexecutor: SerialExecutorReflected
        get() = executorReflected
}

open class AsyncStorageIdlingResource
    @JvmOverloads constructor(
        module: NativeModule,
        sexecutorReflectedGenFn: SExecutorReflectedGenFnType = defaultSExecutorReflectedGenFn)
    : IdlingResource {

    private val moduleReflected = ModuleReflected(module, sexecutorReflectedGenFn)
    private var callback: IdlingResource.ResourceCallback? = null
    private var idleCheckTask: Runnable? = null
    private val idleCheckTaskImpl = Runnable {
        with(moduleReflected.sexecutor) {
            synchronized(executor()) {
                clearIdleCheckTask()

                if (hasPendingTasks()) {
                    Log.d(LOG_TAG, "[inspection task] Busy!, pendingTasks#=${pendingTasksCount()}")
                    enqueueIdleCheckTask()
                } else {
                    Log.d(LOG_TAG, "[inspection task] IDLE! (calling callback)")
                    callback?.onTransitionToIdle()
                }
            }
        }
    }

    override fun getName(): String = javaClass.name

    override fun isIdleNow(): Boolean =
        checkIdle().also { idle ->
            if (!idle) {
                enqueueIdleCheckTask()
            }
        }

    override fun registerIdleTransitionCallback(callback: IdlingResource.ResourceCallback?) {
        Log.d(LOG_TAG, "Registering a new resource callback")
        this.callback = callback
        enqueueIdleCheckTask()
    }

    private fun checkIdle(): Boolean =
        with(moduleReflected.sexecutor) {
            synchronized(executor()) {
                (!hasActiveTask() && !hasPendingTasks()).also { result: Boolean ->
                    Log.d(LOG_TAG, "[idle check]: ${if (result) "IDLE" else "busy! pendingTasks#=${pendingTasksCount()}"}")
                }
            }
        }
    private fun enqueueIdleCheckTask() =
        with(moduleReflected.sexecutor) {
            synchronized(executor()) {
                if (idleCheckTask == null) {
                    initIdleCheckTask()
                    Log.d(LOG_TAG, "Enqueued an inspection task!")
                    executeTask(idleCheckTask!!)
                } else {
                    Log.d(LOG_TAG, "NOT enqueueing an inspection task")
                }
            }
        }

    private fun initIdleCheckTask() {
        idleCheckTask = idleCheckTaskImpl
    }

    private fun clearIdleCheckTask() {
        idleCheckTask = null
    }

    companion object {
        private const val LOG_TAG = "AsyncStorageIR"

        fun createIfNeeded(reactContext: ReactContext, legacy: Boolean): AsyncStorageIdlingResource? {
            Log.d(Detox.LOG_TAG, "Checking whether a custom IR for Async-Storage is required... (legacy=$legacy)")

            return RNHelpers.getNativeModule(reactContext, className(legacy))?.let { module ->
                Log.d(Detox.LOG_TAG, "IR for Async-Storage is required! (legacy=$legacy)")
                createInstance(module, legacy)
            }
        }

        private fun className(legacy: Boolean): String {
            val packageName = if (legacy) "com.facebook.react.modules.storage" else "com.reactnativecommunity.asyncstorage"
            return "$packageName.AsyncStorageModule"
        }

        private fun createInstance(module: NativeModule, legacy: Boolean) =
            if (legacy) AsyncStorageIdlingResourceLegacy(module) else AsyncStorageIdlingResource(module)
    }
}

class AsyncStorageIdlingResourceLegacy(module: NativeModule): AsyncStorageIdlingResource(module)
