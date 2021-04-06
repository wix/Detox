package com.wix.detox.reactnative.idlingresources

import android.util.Log
import androidx.test.espresso.IdlingResource
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactContext
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
    : DescriptiveIdlingResource {

    open val logTag: String
        get() = LOG_TAG

    private val moduleReflected = ModuleReflected(module, sexecutorReflectedGenFn)
    private var callback: IdlingResource.ResourceCallback? = null
    private var idleCheckTask: Runnable? = null
    private val idleCheckTaskImpl = Runnable {
        with(moduleReflected.sexecutor) {
            synchronized(executor()) {
                if (hasPendingTasks()) {
                    executeTask(idleCheckTask!!)
                } else {
                    clearIdleCheckTask()
                    callback?.onTransitionToIdle()
                }
            }
        }
    }

    override fun getName(): String = javaClass.name
    override fun getDescription() = "Disk I/O activity"
    override fun isIdleNow(): Boolean =
        checkIdle().also { idle ->
            if (!idle) {
                Log.d(logTag, "Async-storage is busy!")
                enqueueIdleCheckTask()
            }
        }
    override fun registerIdleTransitionCallback(callback: IdlingResource.ResourceCallback?) {
        this.callback = callback
        enqueueIdleCheckTask()
    }

    private fun checkIdle(): Boolean =
        with(moduleReflected.sexecutor) {
            synchronized(executor()) {
                !hasActiveTask() && !hasPendingTasks()
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

        fun createIfNeeded(reactContext: ReactContext, legacy: Boolean): AsyncStorageIdlingResource? {
            Log.d(LOG_TAG, "Checking whether a custom IR for Async-Storage is required... (legacy=$legacy)")

            return RNHelpers.getNativeModule(reactContext, className(legacy))?.let { module ->
                Log.d(LOG_TAG, "IR for Async-Storage is required! (legacy=$legacy)")
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

class AsyncStorageIdlingResourceLegacy(module: NativeModule): AsyncStorageIdlingResource(module) {
    override val logTag: String
        get() = super.logTag + "Legacy"
}
