package com.wix.detox.reactnative.idlingresources.storage

import android.util.Log
import androidx.test.espresso.IdlingResource
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactContext
import com.wix.detox.reactnative.helpers.RNHelpers
import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource
import org.joor.Reflect
import java.util.concurrent.Executor

private const val LOG_TAG = "AsyncStorageIR"

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
    private val reactContext: ReactContext,
    private val sexecutorReflectedGenFn: SExecutorReflectedGenFnType = defaultSExecutorReflectedGenFn,
    private val rnHelpers: RNHelpers = RNHelpers()
) : DetoxIdlingResource() {

    val logTag: String
        get() = LOG_TAG

    private val moduleReflected: ModuleReflected? = null
    private var idleCheckTask: Runnable? = null
    private val idleCheckTaskImpl = Runnable {
        val module = getModuleReflected() ?: return@Runnable
        with(module.sexecutor) {
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

    private fun getModuleReflected(): ModuleReflected? {

        fun className(): String {
            val packageName = "com.reactnativecommunity.asyncstorage"
            return "$packageName.AsyncStorageModule"
        }

        if (moduleReflected != null) {
            return moduleReflected
        }

        val nativeModule = rnHelpers.getNativeModule(reactContext, className()) ?: return null
        return ModuleReflected(nativeModule, sexecutorReflectedGenFn)
    }

    private fun checkIdleInternal(): Boolean {
        val module = getModuleReflected() ?: return true
        return with(module.sexecutor) {
            synchronized(executor()) {
                !hasActiveTask() && !hasPendingTasks()
            }
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

    private fun enqueueIdleCheckTask() {
        val module = getModuleReflected() ?: return
        with(module.sexecutor) {
            synchronized(executor()) {
                if (idleCheckTask == null) {
                    initIdleCheckTask()
                    executeTask(idleCheckTask!!)
                }
            }
        }
    }

    private fun initIdleCheckTask() {
        idleCheckTask = idleCheckTaskImpl
    }

    private fun clearIdleCheckTask() {
        idleCheckTask = null
    }
}
