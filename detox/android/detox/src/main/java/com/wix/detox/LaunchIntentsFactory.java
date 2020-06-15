package com.wix.detox;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

class LaunchIntentsFactory {

    /**
     * Constructs an intent tightly associated with a specific activity.
     *
     * @param activity The activity to launch (typically extracted from an ActivityTestRule).
     *
     * @return The resulting intent.
     */
    Intent activityLaunchIntent(Activity activity) {
        final Context appContext = activity.getApplicationContext();
        final Intent intent = new Intent(appContext, activity.getClass());
        intent.setFlags(getCoreFlags());
        return intent;
    }

    /**
     * Constructs a near-empty, activity-anonymous intent, assuming an ActivityTestRule instance that would handle it will fill in all the missing details -
     * namely, the activity class (aka component), which is taken from activityTestRule's own activityClass data member
     * which was set in the c'tor by the user (outside of Detox)
     *
     * @return The resulting intent.
     */
    Intent cleanIntent() {
        return new Intent(Intent.ACTION_MAIN);
    }

    /**
     * Constructs an activity-anonymous intent with a URL such that the resolved activity to be launched would be an activity that has
     * been defined to match it using an intent-filter xml tag associated with an {@link Intent#ACTION_VIEW} action.
     *
     * @param url The activity-lookup URL.
     * @param initialLaunch Whether this is done in the context of the preliminary app launch, or midway through a running test.
     *
     * @return The resulting intent.
     */
    Intent intentWithUrl(String url, boolean initialLaunch) {
        final Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setData(Uri.parse(url));
        intent.setFlags(getCoreFlags());

        if (initialLaunch) {
            intent.addFlags(getInitialLaunchFlags());
        }
        return intent;
    }

    Intent intentWithNotificationData(Bundle data, boolean initialLaunch) {
        final Intent intent = new Intent(Intent.ACTION_MAIN);
        intent.addCategory(Intent.CATEGORY_LAUNCHER);
        intent.putExtras(data);
        intent.setFlags(getCoreFlags());

        if (initialLaunch) {
            intent.addFlags(getInitialLaunchFlags());
        }
        return intent;
    }

    private int getCoreFlags() {
        // CLEAR_TOP is important so as to avoid launching the app's main activity over an existing instance (in the same task),
        // in case it's already running. It *would* happen without the flag, since by default ActivityTestRule instances
        // are created so as to force the FLAG_ACTIVITY_NEW_TASK flag in the initial launch (see flags-less c'tor), which
        // evidently causes consequent launches to create additional activity instances on top of it (although inside the same task).
        // SINGLE_TOP here is needed as well so as to avoid the *relaunch* of the already-running activity (rather, the intent
        // would be delivered to that activity's onNewIntent(), as explain in the docs for CLEAR_TOP).
        return (Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
    }

    private int getInitialLaunchFlags() {
        // Upon initial launch (first-ever instance of the test activity), we also manually need to add the NEW_TASK flag
        // so as to mimic the ActivityTestRule's behavior: we get NEW_TASK from it if no flags are specified; here we _do_
        // specify flags so need to add it ourselves.
        return Intent.FLAG_ACTIVITY_NEW_TASK;
    }
}
