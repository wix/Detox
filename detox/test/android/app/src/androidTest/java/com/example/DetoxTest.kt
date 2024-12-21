package com.example

import android.app.Activity
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.rule.ActivityTestRule
import com.wix.detox.Detox
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * A selector arg that when set 'true', will launch the [SingleInstanceActivity] rather than the default [MainActivity].
 * Important so as to allow for some testing of Detox in this particular mode, which has been proven to introduce caveats.
 * Here for internal usage; Not external-API related.
 */
private const val USE_SINGLE_INSTANCE_ACTIVITY_ARG = "detoxAndroidSingleInstanceActivity"

/** Similar concept to that of [.USE_SINGLE_INSTANCE_ACTIVITY_ARG].  */
private const val USE_CRASHING_ACTIVITY_ARG = "detoxAndroidCrashingActivity"

@RunWith(AndroidJUnit4::class)
@LargeTest
class DetoxTest {

    @Test
    fun runDetoxTests() {
        TestButlerProbe.assertReadyIfInstalled()
        val rule = resolveTestRule()
        Detox.runTests(rule)
    }

    private fun resolveTestRule(): Class<out Activity> {
        val arguments =
            InstrumentationRegistry.getArguments()
        val useSingleTaskActivity =
            arguments.getString(USE_SINGLE_INSTANCE_ACTIVITY_ARG, "false")
                .toBoolean()
        val useCrashingActivity =
            arguments.getString(USE_CRASHING_ACTIVITY_ARG, "false").toBoolean()
        return if (useSingleTaskActivity) SingleInstanceActivity::class.java else if (useCrashingActivity) SingleInstanceActivity::class.java else MainActivity::class.java
    }
}
