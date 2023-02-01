package com.example;

import android.os.Bundle;

import com.wix.detox.Detox;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.rule.ActivityTestRule;

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {

    /**
     * A selector arg that when set 'true', will launch the {@link SingleInstanceActivity} rather than the default {@link MainActivity}.
     * Important so as to allow for some testing of Detox in this particular mode, which has been proven to introduce caveats.
     * </br>Here for internal usage; Not external-API related.
     */
    private static final String USE_SINGLE_INSTANCE_ACTIVITY_ARG = "detoxAndroidSingleInstanceActivity";

    /** Similar concept to that of {@link #USE_SINGLE_INSTANCE_ACTIVITY_ARG}. */
    private static final String USE_CRASHING_ACTIVITY_ARG = "detoxAndroidCrashingActivity";

    @Rule
    public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<>(MainActivity.class, false, false);

    @Rule
    public ActivityTestRule<SingleInstanceActivity> mSingleInstanceActivityRule = new ActivityTestRule<>(SingleInstanceActivity.class, false, false);

    @Rule
    public ActivityTestRule<CrashingActivity> mCrashingActivityTestRule = new ActivityTestRule<>(CrashingActivity.class, false, false);

    @Test
    public void runDetoxTests() {
        TestButlerProbe.assertReadyIfInstalled();

        final ActivityTestRule<?> rule = resolveTestRule();
        Detox.runTests(rule);
    }

    private ActivityTestRule<?> resolveTestRule() {
        final Bundle arguments = InstrumentationRegistry.getArguments();
        final boolean useSingleTaskActivity = Boolean.parseBoolean(arguments.getString(USE_SINGLE_INSTANCE_ACTIVITY_ARG, "false"));
        final boolean useCrashingActivity = Boolean.parseBoolean(arguments.getString(USE_CRASHING_ACTIVITY_ARG, "false"));
        final ActivityTestRule<?> rule =
                useSingleTaskActivity
                        ? mSingleInstanceActivityRule
                        : useCrashingActivity
                            ? mCrashingActivityTestRule
                            : mActivityRule;
        return rule;
    }
}
