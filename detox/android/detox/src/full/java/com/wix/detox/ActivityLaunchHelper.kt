package com.wix.detox

import android.app.Instrumentation.ActivityMonitor
import android.content.Context
import android.content.Intent
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.rule.ActivityTestRule

class ActivityLaunchHelper
    @JvmOverloads constructor(
        private val activityTestRule: ActivityTestRule<*>,
        private val launchArgs: LaunchArgs = LaunchArgs(),
        private val intentsFactory: LaunchIntentsFactory = LaunchIntentsFactory(),
        private val notificationDataParserGen: (String) -> NotificationDataParser = { path -> NotificationDataParser(path) }
) {
    fun launchActivityUnderTest() {
        val intent = extractInitialIntent()
        activityTestRule.launchActivity(intent)
    }

    fun launchMainActivity() {
        val activity = activityTestRule.activity
        launchActivitySync(intentsFactory.activityLaunchIntent(activity))
    }

    fun startActivityFromUrl(url: String) {
        launchActivitySync(intentsFactory.intentWithUrl(url, false))
    }

    fun startActivityFromNotification(dataFilePath: String) {
        val notificationData = notificationDataParserGen(dataFilePath).toBundle()
        val intent = intentsFactory.intentWithNotificationData(appContext, notificationData, false)
        launchActivitySync(intent)
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
        // Ideally, we would just call sActivityTestRule.launchActivity(intent) and get it over with.
        // BUT!!! as it turns out, Espresso has an issue where doing this for an activity running in the background
        // would have Espresso set up an ActivityMonitor which will spend its time waiting for the activity to load, *without
        // ever being released*. It will finally fail after a 45 seconds timeout.
        // Without going into full details, it seems that activity test rules were not meant to be used this way. However,
        // the all-new ActivityScenario implementation introduced in androidx could probably support this (e.g. by using
        // dedicated methods such as moveToState(), which give better control over the lifecycle).
        // In any case, this is the core reason for this issue: https://github.com/wix/Detox/issues/1125
        // What it forces us to do, then, is this -
        // 1. Launch the activity by "ourselves" from the OS (i.e. using context.startActivity()).
        // 2. Set up an activity monitor by ourselves -- such that it would block until the activity is ready.
        // ^ Hence the code below.
        val activity = activityTestRule.activity
        val activityMonitor = ActivityMonitor(activity.javaClass.name, null, true)
        activity.startActivity(intent)

        InstrumentationRegistry.getInstrumentation().run {
            addMonitor(activityMonitor)
            waitForMonitorWithTimeout(activityMonitor, ACTIVITY_LAUNCH_TIMEOUT)
        }
    }

    private val appContext: Context
        get() = InstrumentationRegistry.getInstrumentation().targetContext.applicationContext

    companion object {
        private const val INTENT_LAUNCH_ARGS_KEY = "launchArgs"
        private const val ACTIVITY_LAUNCH_TIMEOUT = 10000L
    }
}
