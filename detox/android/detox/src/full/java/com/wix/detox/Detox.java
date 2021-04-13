package com.wix.detox;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import com.wix.detox.config.DetoxConfig;
import com.wix.detox.espresso.UiControllerSpy;

import java.util.concurrent.TimeUnit;

import androidx.annotation.NonNull;
import androidx.test.espresso.IdlingPolicies;
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
    private static final String INTENT_LAUNCH_ARGS_KEY = "launchArgs";
    private static final long ACTIVITY_LAUNCH_TIMEOUT = 10000L;

    private static final LaunchArgs sLaunchArgs = new LaunchArgs();
    private static final LaunchIntentsFactory sIntentsFactory = new LaunchIntentsFactory();
    private static ActivityTestRule sActivityTestRule;

    /**
     * Specification of values to use for Espresso's {@link IdlingPolicies} timeouts.
     * <br/>Overrides Espresso's defaults as they tend to be too short (e.g. when running a heavy-load app
     * on suboptimal CI machines).
     *
     * @deprecated Use {@link com.wix.detox.config.DetoxConfig}.
     */
    @Deprecated
    public static class DetoxIdlePolicyConfig {
        /** Directly binds to {@link IdlingPolicies#setMasterPolicyTimeout(long, TimeUnit)}. Applied in seconds. */
        public Integer masterTimeoutSec = 120;
        /** Directly binds to {@link IdlingPolicies#setIdlingResourceTimeout(long, TimeUnit)}. Applied in seconds. */
        public Integer idleResourceTimeoutSec = 60;

        private com.wix.detox.config.DetoxIdlePolicyConfig toNewConfig() {
            com.wix.detox.config.DetoxIdlePolicyConfig newConfig = new com.wix.detox.config.DetoxIdlePolicyConfig();
            newConfig.masterTimeoutSec = masterTimeoutSec;
            newConfig.idleResourceTimeoutSec = idleResourceTimeoutSec;
            return newConfig;
        }
    }

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
     *
     * @param activityTestRule the activityTestRule
     */
    public static void runTests(ActivityTestRule activityTestRule) {
        runTests(activityTestRule, getAppContext());
    }

    /**
     * Same as the default {@link #runTests(ActivityTestRule)} method, but allows for the explicit specification of
     * various configurations. Note: review {@link DetoxConfig} for defaults.
     *
     * @param detoxConfig The configurations to apply.
     */
    public static void runTests(ActivityTestRule activityTestRule, DetoxConfig detoxConfig) {
        runTests(activityTestRule, getAppContext(), detoxConfig);
    }

    /**
     * Same as the default {@link #runTests(ActivityTestRule)} method, but allows for the explicit specification of
     * a custom idle-policy configuration. Note: review {@link DetoxIdlePolicyConfig} for defaults.
     *
     * @param idlePolicyConfig The custom idle-policy configuration to pass in; Will be applied into Espresso via
     *                         the {@link IdlingPolicies} API.
     *
     * @deprecated Use {@link #runTests(ActivityTestRule, DetoxConfig)}
     */
    @Deprecated
    public static void runTests(ActivityTestRule activityTestRule, DetoxIdlePolicyConfig idlePolicyConfig) {
        runTests(activityTestRule, getAppContext(), idlePolicyConfig);
    }

    /**
     * <p>
     * Use this method only if you have a React Native application and it
     * doesn't implement ReactApplication; Otherwise use {@link Detox#runTests(ActivityTestRule)}.
     * </p>
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
        runTests(activityTestRule, context, new DetoxConfig());
    }

    /**
     * Same as {@link #runTests(ActivityTestRule, Context)}, but allows for the explicit specification of
     * a custom idle-policy configuration. Note: review {@link DetoxIdlePolicyConfig} for defaults.
     *
     *
     * @param idlePolicyConfig The custom idle-policy configuration to pass in; Will be applied into Espresso via
     *                         the {@link IdlingPolicies} API.
     *
     * @deprecated Use {@link #runTests(ActivityTestRule, Context, DetoxConfig)}
     */
    @Deprecated
    public static void runTests(ActivityTestRule activityTestRule, @NonNull final Context context, DetoxIdlePolicyConfig idlePolicyConfig) {
        DetoxConfig config = new DetoxConfig();
        config.idlePolicyConfig = idlePolicyConfig.toNewConfig();

        runTests(activityTestRule, context, config);
    }

    /**
     * Same as {@link #runTests(ActivityTestRule, Context)}, but allows for the explicit specification of
     * various configurations. Note: review {@link DetoxConfig} for defaults.
     *
     * @param detoxConfig The configurations to apply.
     */
    public static void runTests(ActivityTestRule activityTestRule, @NonNull final Context context, DetoxConfig detoxConfig) {
        DetoxConfig.CONFIG = detoxConfig;
        DetoxConfig.CONFIG.apply();

        sActivityTestRule = activityTestRule;

        UiControllerSpy.attachThroughProxy();

        Intent intent = extractInitialIntent();
        sActivityTestRule.launchActivity(intent);

        try {
            DetoxMain.run(context);
        } catch (Exception e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Detox got interrupted prematurely", e);
        }
    }

    public static void launchMainActivity() {
        final Activity activity = sActivityTestRule.getActivity();
        launchActivitySync(sIntentsFactory.activityLaunchIntent(activity));
    }

    public static void startActivityFromUrl(String url) {
        launchActivitySync(sIntentsFactory.intentWithUrl(url, false));
    }

    public static void startActivityFromNotification(String dataFilePath) {
        Bundle notificationData = new NotificationDataParser(dataFilePath).parseNotificationData();
        Intent intent = sIntentsFactory.intentWithNotificationData(getAppContext(), notificationData, false);
        launchActivitySync(intent);
    }

    private static Intent extractInitialIntent() {
        Intent intent;

        if (sLaunchArgs.hasUrlOverride()) {
            intent = sIntentsFactory.intentWithUrl(sLaunchArgs.getUrlOverride(), true);
        } else if (sLaunchArgs.hasNotificationPath()) {
            Bundle notificationData = new NotificationDataParser(sLaunchArgs.getNotificationPath()).parseNotificationData();
            intent = sIntentsFactory.intentWithNotificationData(getAppContext(), notificationData, true);
        } else {
            intent = sIntentsFactory.cleanIntent();
        }
        intent.putExtra(INTENT_LAUNCH_ARGS_KEY, sLaunchArgs.asIntentBundle());
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
        final Instrumentation.ActivityMonitor activityMonitor = new Instrumentation.ActivityMonitor(activity.getClass().getName(), null, true);

        activity.startActivity(intent);
        instrumentation.addMonitor(activityMonitor);
        instrumentation.waitForMonitorWithTimeout(activityMonitor, ACTIVITY_LAUNCH_TIMEOUT);
    }

    private static Context getAppContext() {
        return InstrumentationRegistry.getInstrumentation().getTargetContext().getApplicationContext();
    }
}
