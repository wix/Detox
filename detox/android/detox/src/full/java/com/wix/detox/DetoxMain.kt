package com.wix.detox

import android.content.Context
import android.util.Log
import com.wix.detox.adapters.server.*
import com.wix.detox.common.DetoxLog.Companion.LOG_TAG
import com.wix.detox.instruments.DetoxInstrumentsManager
import com.wix.detox.reactnative.ReactNativeExtension
import com.wix.invoke.MethodInvocation

private const val INIT_ACTION = "_init"
private const val IS_READY_ACTION = "isReady"
private const val TERMINATION_ACTION = "_terminate"

object DetoxMain {
    @JvmStatic
    fun run(rnHostHolder: Context) {
        val detoxServerInfo = DetoxServerInfo()
        Log.i(LOG_TAG, "Detox server connection details: $detoxServerInfo")

        val testEngineFacade = TestEngineFacade()
        val actionsDispatcher = DetoxActionsDispatcher()
        val externalAdapter = DetoxServerAdapter(actionsDispatcher, detoxServerInfo, IS_READY_ACTION, TERMINATION_ACTION)
        initActionHandlers(actionsDispatcher, externalAdapter, testEngineFacade, rnHostHolder)
        actionsDispatcher.dispatchAction(INIT_ACTION, "", 0)
        actionsDispatcher.join()
    }

    private fun doInit(externalAdapter: DetoxServerAdapter, rnHostHolder: Context) {
        externalAdapter.connect()

        initCrashHandler(externalAdapter)
        initANRListener(externalAdapter)
        initReactNativeIfNeeded(rnHostHolder)
    }

    private fun doTeardown(serverAdapter: DetoxServerAdapter, actionsDispatcher: DetoxActionsDispatcher, testEngineFacade: TestEngineFacade) {
        testEngineFacade.resetReactNative()

        serverAdapter.teardown()
        actionsDispatcher.teardown()
    }

    private fun initActionHandlers(actionsDispatcher: DetoxActionsDispatcher, serverAdapter: DetoxServerAdapter, testEngineFacade: TestEngineFacade, rnHostHolder: Context) {
        // Primary actions
        with(actionsDispatcher) {
            val rnReloadHandler = ReactNativeReloadActionHandler(rnHostHolder, serverAdapter, testEngineFacade)

            associateActionHandler(INIT_ACTION, object : DetoxActionHandler {
                override fun handle(params: String, messageId: Long) =
                    synchronized(this@DetoxMain) {
                        this@DetoxMain.doInit(serverAdapter, rnHostHolder)
                    }
            })
            associateActionHandler(IS_READY_ACTION, ReadyActionHandler(serverAdapter, testEngineFacade))

            associateActionHandler("loginSuccess", ScarceActionHandler())
            associateActionHandler("reactNativeReload", object: DetoxActionHandler {
                override fun handle(params: String, messageId: Long) =
                    synchronized(this@DetoxMain) {
                        rnReloadHandler.handle(params, messageId)
                    }
            })
            associateActionHandler("invoke", InvokeActionHandler(MethodInvocation(), serverAdapter))
            associateActionHandler("cleanup", CleanupActionHandler(serverAdapter, testEngineFacade) {
                dispatchAction(TERMINATION_ACTION, "", 0)
            })
            associateActionHandler(TERMINATION_ACTION, object: DetoxActionHandler {
                override fun handle(params: String, messageId: Long) {
                    this@DetoxMain.doTeardown(serverAdapter, actionsDispatcher, testEngineFacade)
                }
            })

            if (DetoxInstrumentsManager.supports()) {
                val instrumentsManager = DetoxInstrumentsManager(rnHostHolder)
                associateActionHandler("setRecordingState", InstrumentsRecordingStateActionHandler(instrumentsManager, serverAdapter))
                associateActionHandler("event", InstrumentsEventsActionsHandler(instrumentsManager, serverAdapter))
            }
        }

        // Secondary actions
        with(actionsDispatcher) {
            val queryStatusHandler = QueryStatusActionHandler(serverAdapter, testEngineFacade)
            associateActionHandler("currentStatus", object: DetoxActionHandler {
                override fun handle(params: String, messageId: Long) =
                    synchronized(this@DetoxMain) {
                        queryStatusHandler.handle(params, messageId)
                    }
            }, false)
        }
    }

    private fun initCrashHandler(outboundServerAdapter: OutboundServerAdapter) {
        DetoxCrashHandler(outboundServerAdapter).attach()
    }

    private fun initANRListener(outboundServerAdapter: OutboundServerAdapter) {
        DetoxANRHandler(outboundServerAdapter).attach()
    }

    private fun initReactNativeIfNeeded(rnHostHolder: Context) {
        ReactNativeExtension.waitForRNBootstrap(rnHostHolder)
    }
}
