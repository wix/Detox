package com.wix.detox

import android.app.Activity
import android.content.Context
import androidx.test.platform.app.InstrumentationRegistry
import com.wix.detox.DetoxMain.run
import com.wix.detox.config.DetoxConfig

/**
 *
 * Static class.
 *
 *
 * To start Detox tests, call runTests() from a JUnit test.
 * This test must use AndroidJUnitRunner or a subclass of it, as Detox uses Espresso internally.
 * All non-standard async code must be wrapped in an Espresso
 * [IdlingResource](https://google.github.io/android-testing-support-library/docs/espresso/idling-resource/).
 *
 * Example usage
 * <pre>`@runWith(AndroidJUnit4.class)
 * @LargeTest
 * public class DetoxTest {
 * @Rule
 * //The Activity that controls React Native.
 * public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule(MainActivity.class);
 *
 * @Before
 * public void setUpCustomEspressoIdlingResources() {
 * // set up your own custom Espresso resources here
 * }
 *
 * @Test
 * public void runDetoxTests() {
 * Detox.runTests();
 * }
 * }`</pre>
 *
 *
 * Two required parameters are detoxServer and detoxSessionId. These
 * must be provided either by Gradle.
 * <br></br>
 *
 * <pre>`android {
 * defaultConfig {
 * testInstrumentationRunner "android.support.test.runner.AndroidJUnitRunner"
 * testInstrumentationRunnerArguments = [
 * 'detoxServer': 'ws://10.0.2.2:8001',
 * 'detoxSessionId': '1'
 * ]
 * }
 * }`
</pre> *
 *
 * Or through command line, e.g <br></br>
 * <blockquote>`adb shell am instrument -w -e detoxServer ws://localhost:8001 -e detoxSessionId
 * 1 com.example/android.support.test.runner.AndroidJUnitRunner`</blockquote>
 *
 *
 * These are automatically set using,
 * <blockquote>`detox test`</blockquote>
 *
 *
 * If not set, then Detox tests are no ops. So it's safe to mix it with other tests.
 */
object Detox {
    private lateinit var activityLaunchHelper: ActivityLaunchHelper

    /**
     * Same as the default [.runTests] method, but allows for the explicit specification of
     * various configurations. Note: review [DetoxConfig] for defaults.
     *
     * @param detoxConfig The configurations to apply.
     */
    fun runTests(clazz: Class<out Activity>, detoxConfig: DetoxConfig = DetoxConfig()) {
        runTests(clazz, appContext, detoxConfig)
    }
    /**
     * Same as [.runTests], but allows for the explicit specification of
     * various configurations. Note: review [DetoxConfig] for defaults.
     *
     * @param detoxConfig The configurations to apply.
     */
    /**
     *
     *
     * Use this method only if you have a React Native application and it
     * doesn't implement ReactApplication; Otherwise use [Detox.runTests].
     *
     *
     *
     *
     * The only requirement is that the passed in object must have
     * a method with the signature
     * <blockquote>`ReactNativeHost getReactNativeHost();`</blockquote>
     *
     *
     * @param activityTestRule the activityTestRule
     * @param context an object that has a `getReactNativeHost()` method
     */
    /**
     *
     *
     * Call this method from a JUnit test to invoke detox tests.
     *
     *
     *
     *
     * In case you have a non-standard React Native application, consider using
     * [.runTests]}.
     *
     *
     * @param activityTestRule the activityTestRule
     */
    @JvmOverloads
    fun runTests(
        clazz: Class<out Activity>,
        context: Context = appContext,
        detoxConfig: DetoxConfig = DetoxConfig()
    ) {
        DetoxConfig.CONFIG = detoxConfig
        DetoxConfig.CONFIG.apply()
        activityLaunchHelper = ActivityLaunchHelper(clazz)
        run(context, activityLaunchHelper)
    }

    @JvmStatic
    fun launchMainActivity() {
        activityLaunchHelper.launchMainActivity()
    }

    @JvmStatic
    fun startActivityFromUrl(url: String?) {
        activityLaunchHelper.startActivityFromUrl(url!!)
    }

    @JvmStatic
    fun startActivityFromNotification(dataFilePath: String?) {
        activityLaunchHelper.startActivityFromNotification(dataFilePath!!)
    }

    private val appContext: Context
        private get() = InstrumentationRegistry.getInstrumentation().targetContext.applicationContext
}
