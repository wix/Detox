package com.wix.detox

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle

class LaunchIntentsFactory {

    /**
     * Constructs an intent tightly associated with a specific activity.
     *
     * @param activity The activity to launch (typically extracted from an [androidx.test.rule.ActivityTestRule]).
     *
     * @return The resulting intent.
     */
    fun activityLaunchIntent(activity: Activity)
        = Intent(activity.applicationContext,
                 activity.javaClass).apply {
            flags = coreFlags
        }

    /**
     * Constructs a near-empty, activity-anonymous intent, assuming an ActivityTestRule instance that would handle it
     * and fill in all the missing details. Namely, the activity class (aka component), which is taken from activityTestRule's
     * own activityClass data member which was set in the c'tor by the user (outside of Detox).
     *
     * @return The resulting intent.
     */
    fun cleanIntent()
        = Intent(Intent.ACTION_MAIN)

    /**
     * Constructs an activity-anonymous intent with a URL such that the resolved activity to be launched would be an activity that has
     * been defined to match it using an intent-filter xml tag associated with an [Intent.ACTION_VIEW] action.
     *
     * @param url The activity-lookup URL.
     * @param initialLaunch Whether this is done in the context of the preliminary app launch, or midway through a running test.
     *
     * @return The resulting intent.
     */
    fun intentWithUrl(url: String?, initialLaunch: Boolean)
        = Intent(Intent.ACTION_VIEW).apply {
            data = Uri.parse(url)
            flags = coreFlags
            if (initialLaunch) {
                addFlags(initialLaunchFlags)
            }
        }

    /**
     * Constructs an activity-anonymous intent with extras equivalent to a given data bundle, assumed
     * to be holding notification data.
     *
     * In essence, this mimics the way the FCM's default implementation handles simple *message*-ish notifications (as
     * oppose to *data*-ish notifications) on the device, where the sender simply provides only a title, some content
     * (body), and a flat key-value dictionary. What the FCM service does in the use case is to post a notification
     * with a simple launcher-like intent, holding the user data in the extra's root, as originally provided.
     * >Note: this is typically what happens only when the app is in the background/terminated; otherwise the notification
     * is delivered to the apps' registered handlers.
     *
     * Obviously, to properly expose more of what Android has to offer in this context, a more customizable version of
     * this (e.g. with more explicit intent-related configurations) should eventually be introduced as well.
     *
     * @param data The notification data, as a bundle.
     * @param initialLaunch Whether this is done in the context of the preliminary app launch, or midway through a running test.
     *
     * @return The resulting intent.
     */
    fun intentWithNotificationData(appContext: Context, data: Bundle, initialLaunch: Boolean)
        = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
            setPackage(appContext.packageName)
            putExtras(data)
            flags = coreFlags
            if (initialLaunch) {
                addFlags(initialLaunchFlags)
            }
        }

    /**
     * The core flags we typically set in all intents:
     *
     * CLEAR_TOP is important so as to avoid launching the app's main activity over an existing instance (in the same task),
     * in case it's already running. It *would* happen without the flag, since by default ActivityTestRule instances
     * are created so as to force the FLAG_ACTIVITY_NEW_TASK flag in the initial launch (see flags-less c'tor), which
     * evidently causes consequent launches to create additional activity instances on top of it (although inside the same task).
     * SINGLE_TOP here is needed as well so as to avoid the *relaunch* of the already-running activity (rather, the intent
     * would be delivered to that activity's onNewIntent(), as explain in the docs for CLEAR_TOP).
     */
    private val coreFlags: Int
        get() = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP

    /**
     * Additional flags to user to initial-launches (i.e. when launch using a test-rule):
     *
     * Upon initial launch (first-ever instance of the test activity), we also manually need to add the NEW_TASK flag
     * so as to mimic the ActivityTestRule's behavior: we get NEW_TASK from it if no flags are specified; here we _do_
     * specify flags so need to add it ourselves.
     */
    private val initialLaunchFlags: Int
        get() = Intent.FLAG_ACTIVITY_NEW_TASK
}
