package com.wix.detox;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.os.RemoteException;
import android.support.annotation.NonNull;
import android.support.test.InstrumentationRegistry;
import android.support.test.rule.ActivityTestRule;
import android.support.test.uiautomator.UiDevice;
import android.support.test.uiautomator.UiObject;
import android.support.test.uiautomator.UiObjectNotFoundException;
import android.support.test.uiautomator.UiSelector;

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
     * {@link Detox#runTests(ActivityTestRule, Object)}}.
     * </p>
     * @param activityTestRule the activityTestRule
     */
    public static void runTests(ActivityTestRule activityTestRule) {
        Context appContext = InstrumentationRegistry.getTargetContext().getApplicationContext();
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
     * @param Context an object that has a {@code getReactNativeHost()} method
     */
    public static void runTests(ActivityTestRule activityTestRule, @NonNull final Context context) {
        sActivityTestRule = activityTestRule;

        Intent intent = extractInitialIntent();
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
        // Ideally, we would just call sActivityTestRule.launchActivity(intentWithUrl(url)) and get it over with.
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

        final Intent intent = intentWithUrl(url);
        final Activity activity = sActivityTestRule.getActivity();
        final Instrumentation.ActivityMonitor activityMonitor = new Instrumentation.ActivityMonitor(activity.getClass().getName(), null, true);

        activity.startActivity(intent);
        instrumentation.addMonitor(activityMonitor);
        instrumentation.waitForMonitorWithTimeout(activityMonitor, ACTIVITY_LAUNCH_TIMEOUT);
    }

    // TODO: Can't get to launch the app back to previous instance using only intents from inside instrumentation (not sure why).
    // this is a (hopefully) temp solution. Should use intents instead.
    public static void launchMainActivity() throws RemoteException, UiObjectNotFoundException {
        final Context targetContext = InstrumentationRegistry.getTargetContext();

//        Intent intent = targetContext.getPackageManager().getLaunchIntentForPackage(targetContext.getPackageName());
//        intent.setPackage(null);
//        intent.removeCategory(Intent.CATEGORY_LAUNCHER);;
//        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
//        Log.d("Detox", intent.toString());
//        sActivityTestRule.launchActivity(intent);

        UiDevice device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());
        device.pressRecentApps();
        UiSelector selector = new UiSelector();
        String appName = targetContext.getApplicationInfo().loadLabel(targetContext.getPackageManager()).toString();
        UiObject recentApp = device.findObject(selector.descriptionContains(appName));
        recentApp.click();
    }

    private static Intent extractInitialIntent() {
        String detoxURLOverride = InstrumentationRegistry.getArguments().getString(DETOX_URL_OVERRIDE_ARG);
        if (detoxURLOverride != null) {
            return intentWithUrl(detoxURLOverride);
        }
        return null;
    }

    private static Intent intentWithUrl(String url) {
        final Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setData(Uri.parse(url));
        return intent;
    }
}
