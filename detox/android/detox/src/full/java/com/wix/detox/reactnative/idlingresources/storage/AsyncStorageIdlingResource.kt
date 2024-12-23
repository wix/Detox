package com.wix.detox.reactnative.idlingresources.storage

import android.util.Log
import androidx.test.espresso.IdlingResource
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactContext
import com.wix.detox.reactnative.helpers.RNHelpers
import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource
import org.joor.Reflect
import java.util.concurrent.Executor

private typealias SExecutorReflectedGenFnType = (executor: Executor) -> SerialExecutorReflected

private val defaultSExecutorReflectedGenFn: SExecutorReflectedGenFnType =
    { executor: Executor -> SerialExecutorReflected(executor) }

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

class AsyncStorageIdlingResource
@JvmOverloads constructor(
    module: NativeModule,
    sexecutorReflectedGenFn: SExecutorReflectedGenFnType = defaultSExecutorReflectedGenFn
) : DetoxIdlingResource() {

    val logTag: String
        get() = LOG_TAG

    private val moduleReflected = ModuleReflected(module, sexecutorReflectedGenFn)
    private var idleCheckTask: Runnable? = null
    private val idleCheckTaskImpl = Runnable {
        with(moduleReflected.sexecutor) {
            synchronized(executor()) {
                if (hasPendingTasks()) {
                    executeTask(idleCheckTask!!)
                } else {
                    clearIdleCheckTask()
                    notifyIdle()
                }
            }
        }
    }

    override fun getName(): String = javaClass.name
    override fun getDebugName() = "io"
    override fun getBusyHint(): Map<String, Any>? = null


    private fun checkIdleInternal(): Boolean =
        with(moduleReflected.sexecutor) {
            synchronized(executor()) {
                !hasActiveTask() && !hasPendingTasks()
            }
        }

    override fun registerIdleTransitionCallback(callback: IdlingResource.ResourceCallback?) {
        super.registerIdleTransitionCallback(callback)
        enqueueIdleCheckTask()
    }

    override fun checkIdle(): Boolean =
        checkIdleInternal().also { idle ->
            if (!idle) {
                Log.d(logTag, "Async-storage is busy!")
                enqueueIdleCheckTask()
            }
        }

    private fun enqueueIdleCheckTask() =
        with(moduleReflected.sexecutor) {
            synchronized(executor()) {
                if (idleCheckTask == null) {
                    initIdleCheckTask()
                    executeTask(idleCheckTask!!)
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

        fun createIfNeeded(reactContext: ReactContext): AsyncStorageIdlingResource? {
            Log.d(LOG_TAG, "Checking whether a custom IR for Async-Storage is required...")

            return RNHelpers.getNativeModule(reactContext, className())?.let { module ->
                Log.d(LOG_TAG, "IR for Async-Storage is required!")
                createInstance(module)
            }
        }

        private fun className(): String {
            val packageName = "com.reactnativecommunity.asyncstorage"
            return "$packageName.AsyncStorageModule"
        }

        private fun createInstance(module: NativeModule) =
            AsyncStorageIdlingResource(module)
    }
}
