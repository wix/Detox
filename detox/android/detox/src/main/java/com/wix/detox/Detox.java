package com.wix.detox;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.support.annotation.NonNull;
import android.util.Base64;

import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.rule.ActivityTestRule;

/**
 * <p>Static class.</p>
 *
 * <p>To start Detox tests, call runTests() from a JUnit test.
 * This test must use AndroidJUnitRunner or a subclass of it, as Detox uses Espresso internally.
 * All non-standard async code must be wrapped in an Espresso
 * <a href="https://google.github.io/android-testing-support-library/docs/espresso/idling-resource/">IdlingResource</a>.</p>
 *
 * Example usage
 * <pre>{@code
 *@literal @runWith(AndroidJUnit4.class)
 *@literal @LargeTest
 * public class DetoxTest {
 *  @literal @Rule
 *   //The Activity that controls React Native.
 *   public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule(MainActivity.class);
 *
 *  @literal @Before
 *   public void setUpCustomEspressoIdlingResources() {
 *     // set up your own custom Espresso resources here
 *   }
 *
 *  @literal @Test
 *   public void runDetoxTests() {
 *     Detox.runTests();
 *   }
 * }}</pre>
 *
 * <p>Two required parameters are detoxServer and detoxSessionId. These
 * must be provided either by Gradle.
 * <br>
 *
 * <pre>{@code
 * android {
 *   defaultConfig {
 *     testInstrumentationRunner "android.support.test.runner.AndroidJUnitRunner"
 *     testInstrumentationRunnerArguments = [
 *       'detoxServer': 'ws://10.0.2.2:8001',
 *       'detoxSessionId': '1'
 *     ]
 *   }
 * }}
 * </pre>
 *
 * Or through command line, e.g <br>
 * <blockquote>{@code adb shell am instrument -w -e detoxServer ws://localhost:8001 -e detoxSessionId
 * 1 com.example/android.support.test.runner.AndroidJUnitRunner}</blockquote></p>
 *
 * <p>These are automatically set using,
 * <blockquote>{@code detox test}</blockquote></p>
 *
 * <p>If not set, then Detox tests are no ops. So it's safe to mix it with other tests.</p>
 */
public final class Detox {
    private static final String LAUNCH_ARGS_KEY = "launchArgs";
    private static final String DETOX_URL_OVERRIDE_ARG = "detoxURLOverride";
    private static final long ACTIVITY_LAUNCH_TIMEOUT = 10000L;

    private static ActivityTestRule sActivityTestRule;

    private Detox() {
    }

    /**
     * <p>
     * Call this method from a JUnit test to invoke detox tests.
     * </p>
     *
     * <p>
     * In case you have a non-standard React Native application, consider using
     * {@link #runTests(ActivityTestRule, Context)}}.
     * </p>
     * @param activityTestRule the activityTestRule
     */
    public static void runTests(ActivityTestRule activityTestRule) {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext().getApplicationContext();
        runTests(activityTestRule, appContext);
    }

    /**
     * <p>
     * Call this method only if you have a React Native application and it
     * doesn't implement ReactApplication.
     * </p>
     *
     * Call {@link Detox#runTests(ActivityTestRule)} )} in every other case.
     *
     * <p>
     * The only requirement is that the passed in object must have
     * a method with the signature
     * <blockquote>{@code ReactNativeHost getReactNativeHost();}</blockquote>
     * </p>
     *
     * @param activityTestRule the activityTestRule
     * @param context an object that has a {@code getReactNativeHost()} method
     */
    public static void runTests(ActivityTestRule activityTestRule, @NonNull final Context context) {
        sActivityTestRule = activityTestRule;

        Intent intent = extractLaunchIntent();
        activityTestRule.launchActivity(intent);

        // Kicks off another thread and attaches a Looper to that.
        // The goal is to keep the test thread intact,
        // as Loopers can't run on a thread twice.
        Thread t = new Thread(new Runnable() {
            @Override
            public void run() {
                Looper.prepare();
                Handler handler = new Handler();
                handler.post(new Runnable() {
                    @Override
                    public void run() {
                        DetoxManager detoxManager = new DetoxManager(context);
                        detoxManager.start();
                    }
                });
                Looper.loop();
            }
        }, "com.wix.detox.manager");
        t.start();

        try {
            t.join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Got interrupted", e);
        }
    }

    public static void startActivityFromUrl(String url) {
        launchActivitySync(intentWithUrl(url));
    }

    public static void launchMainActivity() {
        final Activity activity = sActivityTestRule.getActivity();
        final Context appContext = activity.getApplicationContext();
        final Intent intent = new Intent(appContext, activity.getClass());

        // SINGLE_TOP is important so as to avoid launching the app's main activity over an existing instance (in the same task),
        // in case it's already running. It *would* happen without the flag, since by default ActivityTestRule instances
        // are created so as to force the FLAG_ACTIVITY_NEW_TASK flag in the initial launch, which evidently causes consequent
        // launches to create additional activity instances on top of it (although inside the same task).
        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        launchActivitySync(intent);
    }

    private static Intent extractLaunchIntent() {
        Intent intent;

        final String detoxURLOverride = InstrumentationRegistry.getArguments().getString(DETOX_URL_OVERRIDE_ARG);
        if (detoxURLOverride != null) {
            intent = intentWithUrl(detoxURLOverride);
        } else {
            intent = cleanIntent();
        }
        intent.putExtra(LAUNCH_ARGS_KEY, readLaunchArgs());
        return intent;
    }

    /**
     * Constructs a near-empty intent, assuming the activityTestRule will fill in all the missing details - namely the activity
     * class (aka component), which is taken from activityTestRule's own activityClass data member which was set in the c'tor
     * by the user (outside of Detox)
     *
     * @return The resulting intent.
     */
    private static Intent cleanIntent() {
        return new Intent(Intent.ACTION_MAIN);
    }

    /**
     * Constructs an intent with a URL such that the resolved activity to be launched would be an activity that has
     * been defined to match it using an intent-filter xml tag, and has been associated with an {@link Intent.ACTION_VIEW} action.
     * @param url The URL to associated.
     * @return The resulting intent.
     */
    private static Intent intentWithUrl(String url) {
        final Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setData(Uri.parse(url));
        return intent;
    }

    private static void launchActivitySync(Intent intent) {
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

        final Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
        final Activity activity = sActivityTestRule.getActivity();
        final Context appContext = activity.getApplicationContext();
        final Instrumentation.ActivityMonitor activityMonitor = new Instrumentation.ActivityMonitor(activity.getClass().getName(), null, true);

        appContext.startActivity(intent);
        instrumentation.addMonitor(activityMonitor);
        instrumentation.waitForMonitorWithTimeout(activityMonitor, ACTIVITY_LAUNCH_TIMEOUT);
    }

    private static Bundle readLaunchArgs() {
        final Bundle instrumArgs = InstrumentationRegistry.getArguments();
        final Bundle launchArgs = new Bundle();

        for (String arg : instrumArgs.keySet()) {
            launchArgs.putString(arg, decodeLaunchArgValue(arg, instrumArgs));
        }
        return launchArgs;
    }

    private static String decodeLaunchArgValue(String arg, Bundle instrumArgs) {
        final String rawValue = instrumArgs.getString(arg);

        if (arg.startsWith("detox")) {
            return rawValue;
        }

        byte[] base64Value = Base64.decode(rawValue, Base64.DEFAULT);
        return new String(base64Value);
    }
}
