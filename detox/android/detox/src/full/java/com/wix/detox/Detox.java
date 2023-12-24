package com.wix.detox;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.rule.ActivityTestRule;

import com.wix.detox.config.DetoxConfig;

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
    private static ActivityLaunchHelper sActivityLaunchHelper;

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
     * various configurations. Note: review {@link DetoxConfig} for defaults.
     *
     * @param detoxConfig The configurations to apply.
     */
    public static void runTests(ActivityTestRule activityTestRule, @NonNull final Context context, DetoxConfig detoxConfig) {
        DetoxConfig.CONFIG = detoxConfig;
        DetoxConfig.CONFIG.apply();

        sActivityLaunchHelper = new ActivityLaunchHelper(activityTestRule);
        DetoxMain.run(context, sActivityLaunchHelper);
    }

    public static void launchMainActivity() {
        sActivityLaunchHelper.launchMainActivity();
    }

    public static void startActivityFromUrl(String url) {
        sActivityLaunchHelper.startActivityFromUrl(url);
    }

    public static void startActivityFromNotification(String dataFilePath) {
        sActivityLaunchHelper.startActivityFromNotification(dataFilePath);
    }

    private static Context getAppContext() {
        return InstrumentationRegistry.getInstrumentation().getTargetContext().getApplicationContext();
    }
}
