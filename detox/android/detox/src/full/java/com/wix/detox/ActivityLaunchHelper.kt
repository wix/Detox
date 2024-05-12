package com.wix.detox

import android.app.Activity
import android.app.Instrumentation.ActivityMonitor
import android.content.Context
import android.content.Intent
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.rule.ActivityTestRule

private const val INTENT_LAUNCH_ARGS_KEY = "launchArgs"

class ActivityLaunchHelper @JvmOverloads constructor(
    private val clazz: Class<out Activity>,
    private val launchArgs: LaunchArgs = LaunchArgs(),
    private val intentsFactory: LaunchIntentsFactory = LaunchIntentsFactory(),
    private val notificationDataParserGen: (String) -> NotificationDataParser = { path -> NotificationDataParser(path) },
    private val activityScenarioWrapperManager: ActivityScenarioWrapperManager = ActivityScenarioWrapperManager()
) {

    private val activityScenarioRules: MutableList<ActivityScenarioWrapper> = mutableListOf()

    fun launchActivityUnderTest() {
        val intent = extractInitialIntent()
        activityScenarioRules.add(activityScenarioWrapperManager.launch(intent))
    }

    fun launchMainActivity() {
        launchActivitySync(intentsFactory.activityLaunchIntent(clazz, context = appContext))
    }

    fun startActivityFromUrl(url: String) {
        launchActivitySync(intentsFactory.intentWithUrl(url, false))
    }

    fun startActivityFromNotification(dataFilePath: String) {
        val notificationData = notificationDataParserGen(dataFilePath).toBundle()
        val intent = intentsFactory.intentWithNotificationData(appContext, notificationData, false)
        launchActivitySync(intent)
    }

    fun close() {
        activityScenarioRules.forEach { it.close() }
    }

    private fun extractInitialIntent(): Intent =
        (if (launchArgs.hasUrlOverride()) {
            intentsFactory.intentWithUrl(launchArgs.urlOverride, true)
        } else if (launchArgs.hasNotificationPath()) {
            val notificationData = notificationDataParserGen(launchArgs.notificationPath).toBundle()
            intentsFactory.intentWithNotificationData(appContext, notificationData, true)
        } else {
            intentsFactory.cleanIntent()
        }).also {
            it.putExtra(INTENT_LAUNCH_ARGS_KEY, launchArgs.asIntentBundle())
        }

    private fun launchActivitySync(intent: Intent) {
        activityScenarioRules.add(activityScenarioWrapperManager.launch(intent))
    }

    private val appContext: Context
        get() = InstrumentationRegistry.getInstrumentation().targetContext.applicationContext


}
