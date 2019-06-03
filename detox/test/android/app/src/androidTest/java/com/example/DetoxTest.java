package com.example;

import android.os.Bundle;

import androidx.test.filters.LargeTest;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.rule.ActivityTestRule;

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
    private static final String SINGLE_INSTANCE_ACTIVITY_ARG = "androidSingleInstanceActivity";

    @Rule
    public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<>(MainActivity.class, false, false);

    @Rule
    public ActivityTestRule<SingleInstanceActivity> mSingleInstanceActivityRule = new ActivityTestRule<>(SingleInstanceActivity.class, false, false);

    @Test
    public void runDetoxTests() {
        final Bundle arguments = InstrumentationRegistry.getArguments();
        final boolean forceSingleTaskActivity = Boolean.parseBoolean(arguments.getString(SINGLE_INSTANCE_ACTIVITY_ARG, "false"));
        final ActivityTestRule<?> rule = forceSingleTaskActivity ? mSingleInstanceActivityRule : mActivityRule;
        Detox.runTests(rule);
    }
}
