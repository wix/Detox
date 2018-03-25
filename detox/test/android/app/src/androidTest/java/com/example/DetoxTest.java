package com.example;

import android.content.Context;
import android.support.test.InstrumentationRegistry;
import android.support.test.espresso.Espresso;
import android.support.test.espresso.action.ViewActions;
import android.support.test.filters.LargeTest;
import android.support.test.rule.ActivityTestRule;
import android.support.test.runner.AndroidJUnit4;

import com.wix.detox.Detox;
import com.wix.detox.ReactNativeSupport;
import com.wix.detox.espresso.DetoxAssertion;
import com.wix.detox.espresso.DetoxMatcher;
import com.wix.detox.espresso.EspressoDetox;

import org.junit.Before;
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
    public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<>(MainActivity.class, false, false);

//    @Test
//    public void runDetoxTests() throws InterruptedException {
//        Detox.runTests(mActivityRule);
//    }

    @Test
    public void Sanity() {
        EspressoDetox.perform(Espresso.onView(DetoxMatcher.matcherForText("Sanity")), ViewActions.click());
        EspressoDetox.perform(Espresso.onView(DetoxMatcher.matcherForText("Say Hello")), ViewActions.click());
        DetoxAssertion.assertMatcher(Espresso.onView(DetoxMatcher.matcherForText("Hello!!!")), DetoxMatcher.matcherForSufficientlyVisible());
    }

    @Test
    public void Actions_should_tap_on_an_element() {
        EspressoDetox.perform(Espresso.onView(DetoxMatcher.matcherForText("Actions")), ViewActions.click());
        EspressoDetox.perform(Espresso.onView(DetoxMatcher.matcherForText("Tap Me")), ViewActions.click());
        DetoxAssertion.assertMatcher(Espresso.onView(DetoxMatcher.matcherForText("Tap Working!!!")), DetoxMatcher.matcherForSufficientlyVisible());
    }

    @Test
    public void Stress_should_handle_tap_during_busy_bridge() {
        EspressoDetox.perform(Espresso.onView(DetoxMatcher.matcherForText("Stress")), ViewActions.click());
        EspressoDetox.perform(Espresso.onView(DetoxMatcher.matcherForText("Bridge TwoWay Stress")), ViewActions.click());
        EspressoDetox.perform(Espresso.onView(DetoxMatcher.matcherForText("Next")), ViewActions.click());
        DetoxAssertion.assertMatcher(Espresso.onView(DetoxMatcher.matcherForText("BridgeTwoWay")), DetoxMatcher.matcherForSufficientlyVisible());
    }

    @Test
    public void Stress_should_handle_consecutive_taps() {
                EspressoDetox.perform(Espresso.onView(DetoxMatcher.matcherForText("Stress")), ViewActions.click());
        for (int i=1; i<=20; i++) {
            EspressoDetox.perform(Espresso.onView(DetoxMatcher.matcherForText("Consecutive Stress " + i)), ViewActions.click());
        }

        DetoxAssertion.assertMatcher(Espresso.onView(DetoxMatcher.matcherForText("Consecutive Stress 21")), DetoxMatcher.matcherForSufficientlyVisible());
    }

    @Test
    public void Animations_should_find_element_driver_JS() {
        EspressoDetox.perform(Espresso.onView(DetoxMatcher.matcherForText("Animations")), ViewActions.click());
        EspressoDetox.perform(Espresso.onView(DetoxMatcher.matcherWithAncestor(DetoxMatcher.matcherForText("JS"), DetoxMatcher.matcherForTestId("UniqueId_AnimationsScreen_useNativeDriver"))), ViewActions.click());
        EspressoDetox.perform(Espresso.onView(DetoxMatcher.matcherForTestId("UniqueId_AnimationsScreen_startButton")), ViewActions.click());
        DetoxAssertion.assertMatcher(Espresso.onView(DetoxMatcher.matcherForTestId("UniqueId_AnimationsScreen_afterAnimationText")), DetoxMatcher.matcherForSufficientlyVisible());
    }

    @Test
    public void Animations_should_find_element_driver_native() {

    }

    @Before
    public void setup() {
        Context appContext = InstrumentationRegistry.getTargetContext().getApplicationContext();
        mActivityRule.launchActivity(null);
        Detox.launchMainActivity();

//        if (ReactNativeSupport.isReactNativeApp()) {
//            ReactNativeSupport.waitForReactNativeLoad(appContext);
//        }

        ReactNativeSupport.reloadApp(appContext);
    }
}


//{"type":"invoke","params":{"target":{"type":"Class","value":"com.wix.detox.espresso.EspressoDetox"},"method":"perform","args":[{"type":"Invocation","value":{"target":{"type":"Class","value":"android.support.test.espresso.Espresso"},"method":"onView","args":[{"type":"Invocation","value":{"target":{"type":"Class","value":"com.wix.detox.espresso.DetoxMatcher"},"method":"matcherForText","args":["Animations"]}}]}},{"type":"Invocation","value":{"target":{"type":"Class","value":"android.support.test.espresso.action.ViewActions"},"method":"click","args":[]}}]},"messageId":1}
//{"type":"invoke","params":{"target":{"type":"Class","value":"com.wix.detox.espresso.EspressoDetox"},"method":"perform","args":[{"type":"Invocation","value":{"target":{"type":"Class","value":"android.support.test.espresso.Espresso"},"method":"onView","args":[{"type":"Invocation","value":{"target":{"type":"Class","value":"com.wix.detox.espresso.DetoxMatcher"},"method":"matcherWithAncestor","args":[{"type":"Invocation","value":{"target":{"type":"Class","value":"com.wix.detox.espresso.DetoxMatcher"},"method":"matcherForText","args":["JS"]}},{"type":"Invocation","value":{"target":{"type":"Class","value":"com.wix.detox.espresso.DetoxMatcher"},"method":"matcherForTestId","args":["UniqueId_AnimationsScreen_useNativeDriver"]}}]}}]}},{"type":"Invocation","value":{"target":{"type":"Class","value":"android.support.test.espresso.action.ViewActions"},"method":"click","args":[]}}]},"messageId":2}
//{"type":"invoke","params":{"target":{"type":"Class","value":"com.wix.detox.espresso.EspressoDetox"},"method":"perform","args":[{"type":"Invocation","value":{"target":{"type":"Class","value":"android.support.test.espresso.Espresso"},"method":"onView","args":[{"type":"Invocation","value":{"target":{"type":"Class","value":"com.wix.detox.espresso.DetoxMatcher"},"method":"matcherForTestId","args":["UniqueId_AnimationsScreen_startButton"]}}]}},{"type":"Invocation","value":{"target":{"type":"Class","value":"android.support.test.espresso.action.ViewActions"},"method":"click","args":[]}}]},"messageId":3}
//{"type":"invoke","params":{"target":{"type":"Class","value":"com.wix.detox.espresso.DetoxAssertion"},"method":"assertMatcher","args":[{"type":"Invocation","value":{"target":{"type":"Class","value":"android.support.test.espresso.Espresso"},"method":"onView","args":[{"type":"Invocation","value":{"target":{"type":"Class","value":"com.wix.detox.espresso.DetoxMatcher"},"method":"matcherForTestId","args":["UniqueId_AnimationsScreen_afterAnimationText"]}}]}},{"type":"Invocation","value":{"target":{"type":"Class","value":"com.wix.detox.espresso.DetoxMatcher"},"method":"matcherForSufficientlyVisible","args":[]}}]},"messageId":4}
