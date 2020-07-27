// Replace this with your app's package
package com.example;

import com.wix.detox.Detox;
import com.wix.detox.config.DetoxConfig;
import com.wix.detox.config.DetoxIdlePolicyConfig;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.rule.ActivityTestRule;

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {
    @Rule
    // Replace 'MainActivity' with the value of android:name entry in 
    // <activity> in AndroidManifest.xml
    public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<>(MainActivity.class, false, false);

    @Test
    public void runDetoxTests() {
        DetoxIdlePolicyConfig idlePolicyConfig = new DetoxIdlePolicyConfig();
        idlePolicyConfig.setMasterTimeoutSec(90);
        idlePolicyConfig.setIdleResourceTimeoutSec(60);

        DetoxConfig detoxConfig = new DetoxConfig();
        detoxConfig.setIdlePolicyConfig(idlePolicyConfig);
        detoxConfig.setRnContextLoadTimeoutSec(com.example.BuildConfig.DEBUG ? 180 : 60);

        Detox.runTests(mActivityRule, detoxConfig);
    }
}
