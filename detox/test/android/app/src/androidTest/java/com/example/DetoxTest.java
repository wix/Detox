package com.example;

import android.content.Context;
import android.content.Intent;
import android.support.test.InstrumentationRegistry;
import android.support.test.filters.LargeTest;
import android.support.test.rule.ActivityTestRule;
import android.support.test.runner.AndroidJUnit4;

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

    @Rule
    public ActivityTestRule<MainActivity> mActivityRule =
        new ActivityTestRule<MainActivity>(MainActivity.class, false, false) {
            @Override
            protected Intent getActivityIntent() {
                Context targetContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
                Intent result = new Intent(targetContext, MainActivity.class);

                // Get the arguments passed to the Test Runner, and forward them to the MainActivity Intent
                // so that they can be received by the app
                result.putExtras(InstrumentationRegistry.getArguments());
                return result;
            }
        };

    @Test
    public void runDetoxTests() {
        Detox.runTests(mActivityRule);
    }
}
