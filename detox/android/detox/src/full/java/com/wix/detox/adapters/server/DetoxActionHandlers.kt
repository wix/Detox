package com.wix.detox.adapters.server

import android.content.Context
import android.util.Log
import com.wix.detox.TestEngineFacade
import com.wix.detox.common.extractRootCause
import com.wix.detox.instruments.DetoxInstrumentsException
import com.wix.detox.instruments.DetoxInstrumentsManager
import com.wix.invoke.MethodInvocation
import org.json.JSONObject
import java.lang.reflect.InvocationTargetException

private const val LOG_TAG = "DetoxActionHandlers"

interface DetoxActionHandler {
    fun handle(params: String, messageId: Long)
}

class ReadyActionHandler(
        private val outboundServerAdapter: OutboundServerAdapter,
        private val testEngineFacade: TestEngineFacade)
    : DetoxActionHandler {

    override fun handle(params: String, messageId: Long) {
        testEngineFacade.awaitIdle()
        outboundServerAdapter.sendMessage("ready", emptyMap(), messageId)
    }
}

open class ReactNativeReloadActionHandler(
        private val appContext: Context,
        private val outboundServerAdapter: OutboundServerAdapter,
        private val testEngineFacade: TestEngineFacade)
    : DetoxActionHandler {

    override fun handle(params: String, messageId: Long) {
        testEngineFacade.syncIdle()
        testEngineFacade.reloadReactNative(appContext)
        outboundServerAdapter.sendMessage("ready", emptyMap(), messageId)
    }
}


class InvokeActionHandler @JvmOverloads constructor(
        private val methodInvocation: MethodInvocation,
        private val outboundServerAdapter: OutboundServerAdapter,
        private val errorParse: (e: Throwable?) -> String = Log::getStackTraceString)
    : DetoxActionHandler {

    private val VIEW_HIERARCHY_TEXT = "View Hierarchy:"

    override fun handle(params: String, messageId: Long) {
        try {
            val invocationResult = methodInvocation.invoke(params)
            outboundServerAdapter.sendMessage("invokeResult", mapOf<String, Any?>("result" to invocationResult), messageId)
        } catch (e: InvocationTargetException) {
            Log.i(LOG_TAG, "Test exception", e)
            val payload = extractFailurePayload(e)
            outboundServerAdapter.sendMessage("testFailed", payload, messageId)
        }  catch (e: Exception) {
            Log.e(LOG_TAG, "Exception", e)
            outboundServerAdapter.sendMessage("error", mapOf<String, Any?>("error" to "${errorParse(e)}\nCheck device logs for full details!\n"), messageId)
        }
    }

    private fun extractFailurePayload(e: InvocationTargetException): Map<String, Any?>
        = e.targetException.message?.let { message: String ->
            if (message.contains(VIEW_HIERARCHY_TEXT)) {
                val error = message.substringBefore(VIEW_HIERARCHY_TEXT).trim()
                val viewHierarchy = message.substringAfter(VIEW_HIERARCHY_TEXT).trim()
                mapOf<String, Any?>("details" to "${error}\n", "viewHierarchy" to viewHierarchy)
            } else {
                val error = extractRootCause(e.targetException)
                mapOf<String, Any?>("details" to error.message)
            }
        } ?: emptyMap()
}

class CleanupActionHandler(
        private val outboundServerAdapter: OutboundServerAdapter,
        private val testEngineFacade: TestEngineFacade,
        private val doStopDetox: () -> Unit)
    : DetoxActionHandler {
    override fun handle(params: String, messageId: Long) {
        val stopRunner = JSONObject(params).optBoolean("stopRunner", false)
        if (stopRunner) {
            doStopDetox()
        } else {
            testEngineFacade.resetReactNative()
        }
        outboundServerAdapter.sendMessage("cleanupDone", emptyMap(), messageId)
    }
}

class InstrumentsRecordingStateActionHandler(
        private val instrumentsManager: DetoxInstrumentsManager,
        private val outboundServerAdapter: OutboundServerAdapter
) : DetoxActionHandler {
    companion object {
        const val DEFAULT_SAMPLING_INTERVAL = 250L
    }

    override fun handle(params: String, messageId: Long) {
        val json = JSONObject(params)
        val recordingPath = json.opt("recordingPath")
        if (recordingPath is String) {
            val samplingInterval = json.optLong("samplingInterval", DEFAULT_SAMPLING_INTERVAL)
            instrumentsManager.startRecordingAtLocalPath(recordingPath, samplingInterval)
        } else {
            instrumentsManager.stopRecording()
        }

        outboundServerAdapter.sendMessage("setRecordingStateDone", emptyMap<String, Any>(), messageId)
    }
}

class InstrumentsEventsActionsHandler(
        private val instrumentsManager: DetoxInstrumentsManager,
        private val outboundServerAdapter: OutboundServerAdapter
) : DetoxActionHandler {

    override fun handle(params: String, messageId: Long) {
        with (JSONObject(params))  {
            when (getString("action")) {
                "begin" -> {
                    instrumentsManager.eventBeginInterval(
                            getString("category"),
                            getString("name"),
                            getString("id"),
                            getString("additionalInfo")
                    )
                }
                "end" -> {
                    instrumentsManager.eventEndInterval(
                            getString("id"),
                            getString("status"),
                            getString("additionalInfo")
                    )
                }
                "mark" -> {
                    instrumentsManager.eventMark(
                            getString("category"),
                            getString("name"),
                            getString("id"),
                            getString("status"),
                            getString("additionalInfo")
                    )
                }
                else -> throw DetoxInstrumentsException("Invalid action")
            }
        }
        outboundServerAdapter.sendMessage("eventDone", emptyMap<String, Any>(), messageId)
    }
}
