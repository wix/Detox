package com.wix.detox

import android.content.Context
import android.util.Log
import com.wix.detox.adapters.server.CleanupActionHandler
import com.wix.detox.adapters.server.DetoxActionHandler
import com.wix.detox.adapters.server.DetoxActionsDispatcher
import com.wix.detox.adapters.server.DetoxServerAdapter
import com.wix.detox.adapters.server.DetoxServerInfo
import com.wix.detox.adapters.server.InstrumentsEventsActionsHandler
import com.wix.detox.adapters.server.InstrumentsRecordingStateActionHandler
import com.wix.detox.adapters.server.InvokeActionHandler
import com.wix.detox.adapters.server.OutboundServerAdapter
import com.wix.detox.adapters.server.QueryStatusActionHandler
import com.wix.detox.adapters.server.ReactNativeReloadActionHandler
import com.wix.detox.adapters.server.ReadyActionHandler
import com.wix.detox.common.DetoxLog
import com.wix.detox.espresso.UiControllerSpy
import com.wix.detox.instruments.DetoxInstrumentsManager
import com.wix.detox.reactnative.ReactNativeExtension
import com.wix.invoke.MethodInvocation

private const val INIT_ACTION = "_init"
private const val IS_READY_ACTION = "isReady"
private const val TERMINATION_ACTION = "_terminate"

object DetoxMain {
    @JvmStatic
    fun run(rnHostHolder: Context, activityLaunchHelper: ActivityLaunchHelper) {
        val detoxServerInfo = DetoxServerInfo()
        val testEngineFacade = TestEngineFacade()
        val actionsDispatcher = DetoxActionsDispatcher()
        val externalAdapter = DetoxServerAdapter(actionsDispatcher, detoxServerInfo, TERMINATION_ACTION)

        initActionHandlers(activityLaunchHelper, actionsDispatcher, externalAdapter, testEngineFacade, rnHostHolder)
        actionsDispatcher.dispatchAction(INIT_ACTION, "", 0)
        actionsDispatcher.join()
    }

    private fun doInit(externalAdapter: DetoxServerAdapter) {
        initCrashHandler(externalAdapter)
        initANRListener(externalAdapter)
        initEspresso()
        initReactNative()

        externalAdapter.connect()
    }

    private fun onLoginSuccess(activityLaunchHelper: ActivityLaunchHelper, rnHostHolder: Context) {
        launchApp(rnHostHolder, activityLaunchHelper)
    }

    private fun doTeardown(serverAdapter: DetoxServerAdapter, actionsDispatcher: DetoxActionsDispatcher, testEngineFacade: TestEngineFacade) {
        testEngineFacade.resetReactNative()

        serverAdapter.teardown()
        actionsDispatcher.teardown()
    }

    private fun initActionHandlers(activityLaunchHelper: ActivityLaunchHelper, actionsDispatcher: DetoxActionsDispatcher, serverAdapter: DetoxServerAdapter, testEngineFacade: TestEngineFacade, rnHostHolder: Context) {
        // Primary actions
        with(actionsDispatcher) {
            val rnReloadHandler = ReactNativeReloadActionHandler(rnHostHolder, serverAdapter, testEngineFacade)

            associateActionHandler(INIT_ACTION, object: DetoxActionHandler {
                override fun handle(params: String, messageId: Long) =
                    synchronized(this@DetoxMain) {
                        this@DetoxMain.doInit(serverAdapter)
                    }
            })
            associateActionHandler(IS_READY_ACTION, ReadyActionHandler(serverAdapter, testEngineFacade))
            associateActionHandler("loginSuccess", object: DetoxActionHandler {
                override fun handle(params: String, messageId: Long) =
                    synchronized(this@DetoxMain) {
                        this@DetoxMain.onLoginSuccess(activityLaunchHelper, rnHostHolder)
                    }
            })
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

    private fun initEspresso() {
        UiControllerSpy.attachThroughProxy()
    }

    private fun initReactNative() {
        ReactNativeExtension.initIfNeeded()
    }

    private fun launchApp(rnHostHolder: Context, activityLaunchHelper: ActivityLaunchHelper) {
        Log.i(DetoxLog.LOG_TAG, "Launching the tested activity!")
        activityLaunchHelper.launchActivityUnderTest()
        ReactNativeExtension.waitForRNBootstrap(rnHostHolder)
    }
}
