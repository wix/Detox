package com.wix.detox

import android.content.Context
import android.util.Log
import androidx.test.espresso.IdlingResource
import com.wix.detox.instruments.DetoxInstrumentsException
import com.wix.detox.instruments.DetoxInstrumentsManager
import com.wix.invoke.MethodInvocation
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.lang.reflect.InvocationTargetException

private const val LOG_TAG = "DetoxActionHandlers"

interface DetoxActionHandler {
    fun handle(params: String, messageId: Long)
}

class ReadyActionHandler(
        private val wsClient: WebSocketClient,
        private val testEngineFacade: TestEngineFacade)
    : DetoxActionHandler {

    override fun handle(params: String, messageId: Long) {
        testEngineFacade.awaitIdle()
        wsClient.sendAction("ready", emptyMap<Any, Any>(), messageId)
    }
}

class ReactNativeReloadActionHandler(
        private val appContext: Context,
        private val wsClient: WebSocketClient,
        private val testEngineFacade: TestEngineFacade)
    : DetoxActionHandler {

    override fun handle(params: String, messageId: Long) {
        testEngineFacade.syncIdle()
        testEngineFacade.reloadReactNative(appContext)
        wsClient.sendAction("ready", emptyMap<Any, Any>(), messageId)
    }
}

class InvokeActionHandler(
        private val methodInvocation: MethodInvocation,
        private val wsClient: WebSocketClient,
        private val errorParse: (e: Throwable?) -> String)
    : DetoxActionHandler {

    override fun handle(params: String, messageId: Long) {
        try {
            val invocationResult = methodInvocation.invoke(params)
            wsClient.sendAction("invokeResult", mapOf<String, Any?>("result" to invocationResult), messageId)
        } catch (e: InvocationTargetException) {
            Log.e(LOG_TAG, "Exception", e)
            wsClient.sendAction("error", mapOf<String, Any?>("error" to "${errorParse(e.targetException)}\nCheck device logs for full details!\n"), messageId)
        } catch (e: Exception) {
            Log.i(LOG_TAG, "Test exception", e)
            wsClient.sendAction("testFailed", mapOf<String, Any?>("details" to "${errorParse(e)}\nCheck device logs for full details!\n"), messageId)
        }
    }
}

class CleanupActionHandler(
        private val wsClient: WebSocketClient,
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
        wsClient.sendAction("cleanupDone", emptyMap<Any, Any>(), messageId)
    }
}

class QueryStatusActionHandler(
        private val wsClient: WebSocketClient,
        private val testEngineFacade: TestEngineFacade)
    : DetoxActionHandler {

    override fun handle(params: String, messageId: Long) {
        val busyResources = testEngineFacade.getBusyIdlingResources()
        val data = mutableMapOf<String, Any>()

        if (busyResources.isEmpty()) {
            data["state"] = "idle"
        } else {
            val resources = JSONArray()
            busyResources.forEach {
                try {
                    resources.put(getIdleResourceInfo(it))
                } catch (je: JSONException) {
                    Log.d(LOG_TAG, "Couldn't collect busy resource '${it.name}'", je)
                }
            }

            data["resources"] = resources
            data["state"] = "busy"
        }

        wsClient.sendAction("currentStatusResult", data, messageId)
    }

    private fun getIdleResourceInfo(resource: IdlingResource) =
        JSONObject().apply {
            put("name", resource.javaClass.simpleName)
            put("info", JSONObject().apply {
                put("prettyPrint", resource.name)
            })
        }
}

class InstrumentsRecordingStateActionHandler(
        private val instrumentsManager: DetoxInstrumentsManager,
        private val wsClient: WebSocketClient
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

        wsClient.sendAction("setRecordingStateDone", emptyMap<String, Any>(), messageId)
    }
}

class InstrumentsEventsActionsHandler(
        private val instrumentsManager: DetoxInstrumentsManager,
        private val wsClient: WebSocketClient
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

        wsClient.sendAction("eventDone", emptyMap<String, Any>(), messageId)
    }

}