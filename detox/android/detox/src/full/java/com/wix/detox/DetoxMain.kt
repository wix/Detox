package com.wix.detox

import android.content.Context
import android.util.Log
import com.wix.detox.adapters.server.*
import com.wix.detox.common.DetoxLog
import com.wix.detox.espresso.UiControllerSpy
import com.wix.detox.instruments.DetoxInstrumentsManager
import com.wix.detox.reactnative.ReactNativeExtension
import com.wix.invoke.MethodInvocation
import java.util.concurrent.CountDownLatch

private const val TERMINATION_ACTION = "_terminate"

object DetoxMain {
    private val loginMonitor = CountDownLatch(1)

    @JvmStatic
    fun run(rnHostHolder: Context, activityLaunchHelper: ActivityLaunchHelper) {
        val detoxServerInfo = DetoxServerInfo()
        val testEngineFacade = TestEngineFacade()
        val actionsDispatcher = DetoxActionsDispatcher()
        val externalAdapter = DetoxServerAdapter(actionsDispatcher, detoxServerInfo, TERMINATION_ACTION)

        initActionHandlers(actionsDispatcher, externalAdapter, testEngineFacade, rnHostHolder)
        initCrashHandler(externalAdapter)
        initANRListener(externalAdapter)
        initEspresso()
        initReactNative()

        externalAdapter.connect()

        launchActivityOnCue(rnHostHolder, activityLaunchHelper)
        actionsDispatcher.join()
    }

    /**
     * Launch the tested activity "on cue", meaning - right after a connection is established and the handshake
     * completes successfully.
     *
     * This has to be synchronized so that an `isReady` isn't handled *before* the activity is launched (albeit not fully
     * initialized - all native modules and everything) and a react context is available.
     *
     * As a better alternative, it would make sense to execute this as a simple action from within the actions
     * dispatcher (i.e. handler of `loginSuccess`), in which case, no inter-thread sync (latches) would be required
     * thanks to the usage of Handlers. However, for a reason we're not yet sure of, in this type of a solution,
     * errors / crashes would be reported not by instrumentation itself, but based on the `AppWillTerminateWithError`
     * message. For a reason we're not sure of yet, it is ignored by the test runner at this point.
     */
    @Synchronized
    private fun launchActivityOnCue(rnHostHolder: Context, activityLaunchHelper: ActivityLaunchHelper) {
        awaitHandshake()
        launchActivity(rnHostHolder, activityLaunchHelper)
    }

    private fun awaitHandshake() {
        loginMonitor.await()
    }

    private fun onLoginSuccess() {
        loginMonitor.countDown()
    }

    private fun doTeardown(serverAdapter: DetoxServerAdapter, actionsDispatcher: DetoxActionsDispatcher, testEngineFacade: TestEngineFacade) {
        testEngineFacade.resetReactNative()

        serverAdapter.teardown()
        actionsDispatcher.teardown()
    }

    private fun initActionHandlers(actionsDispatcher: DetoxActionsDispatcher, serverAdapter: DetoxServerAdapter, testEngineFacade: TestEngineFacade, rnHostHolder: Context) {
        // Primary actions
        with(actionsDispatcher) {
            val readyHandler = ReadyActionHandler(serverAdapter, testEngineFacade)
            val rnReloadHandler = ReactNativeReloadActionHandler(rnHostHolder, serverAdapter, testEngineFacade)

            associateActionHandler("isReady") { params, messageId ->
                synchronized(this@DetoxMain) {
                    readyHandler.handle(params, messageId)
                }
            }
            associateActionHandler("loginSuccess") { _, _ -> this@DetoxMain.onLoginSuccess() }
            associateActionHandler("reactNativeReload") { params, messageId ->
                synchronized(this@DetoxMain) {
                    rnReloadHandler.handle(params, messageId)
                }
            }
            associateActionHandler("invoke", InvokeActionHandler(MethodInvocation(), serverAdapter))
            associateActionHandler("cleanup", CleanupActionHandler(serverAdapter, testEngineFacade) {
                dispatchAction(TERMINATION_ACTION, "", 0)
            })
            associateActionHandler(TERMINATION_ACTION) { _, _ ->
                this@DetoxMain.doTeardown(serverAdapter, actionsDispatcher, testEngineFacade)
            }

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

    private fun launchActivity(rnHostHolder: Context, activityLaunchHelper: ActivityLaunchHelper) {
        Log.i(DetoxLog.LOG_TAG, "Launching the tested activity!")
        activityLaunchHelper.launchActivityUnderTest()
        ReactNativeExtension.waitForRNBootstrap(rnHostHolder)
    }
}
