package com.example;

import android.content.Context;
import android.support.test.filters.LargeTest;
import android.support.test.runner.AndroidJUnit4;

import com.wix.detox.Detox;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import static android.support.test.InstrumentationRegistry.getInstrumentation;

/**
 * Created by simonracz on 28/05/2017.
 */

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {

    @Before
    public void startDefaultActivity() {
        final Context targetContext = getInstrumentation().getTargetContext();
        targetContext.startActivity(targetContext.getPackageManager().getLaunchIntentForPackage(targetContext.getPackageName()));

    }

    @Before
    public void setUpCustomEspressoIdlingResources() {

    }

    @Test
    public void runDetoxTests() {
        Detox.runTests();
    }
}
