package com.example;

import android.os.Bundle;
import android.support.test.filters.LargeTest;
import android.support.test.rule.ActivityTestRule;
import android.support.test.runner.AndroidJUnit4;
import android.support.test.InstrumentationRegistry;

import com.wix.detox.Detox;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Created by simonracz on 28/05/2017.
 */

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {

    /**
     * A selector arg that when set 'true', will launch the {@link SingleInstanceActivity} rather than the default {@link MainActivity}.
     * Important so as to allow for some testing of Detox in this particular mode, which has been proven to introduce caveats.
     * </br>Here for internal usage; Not external-API related.
     */
    private static final String FORCE_SINGLE_TASK_ACTIVITY_ARG = "forceSingleTask";

    @Rule
    public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<>(MainActivity.class, false, false);

    @Rule
    public ActivityTestRule<SingleInstanceActivity> mSingleInstanceActivityRule = new ActivityTestRule<>(SingleInstanceActivity.class, false, false);

    @Test
    public void runDetoxTests() {
        final Bundle arguments = InstrumentationRegistry.getArguments();
        final boolean forceSingleTaskActivity = Boolean.parseBoolean(arguments.getString(FORCE_SINGLE_TASK_ACTIVITY_ARG, "false"));
        final ActivityTestRule<?> rule = forceSingleTaskActivity ? mSingleInstanceActivityRule : mActivityRule;
        Detox.runTests(rule);
    }
}
