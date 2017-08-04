package com.wix.detox.espresso;

import android.support.test.espresso.ViewInteraction;
import android.view.View;

import org.hamcrest.Matcher;

import static android.support.test.espresso.assertion.ViewAssertions.doesNotExist;
import static android.support.test.espresso.assertion.ViewAssertions.matches;
import static android.support.test.espresso.matcher.ViewMatchers.isDisplayed;
import static org.hamcrest.Matchers.not;

/**
 * Created by simonracz on 10/07/2017.
 */

public class DetoxAssertion {

    private DetoxAssertion() {
        // static class
    }

    public static ViewInteraction assertMatcher(ViewInteraction i, Matcher<View> m) {
        return i.check(matches(m));
    }

    public static ViewInteraction assertNotVisible(ViewInteraction i) {
        ViewInteraction ret;
        try {
            ret = i.check(doesNotExist());
            return ret;
        } catch (RuntimeException e) {
            ret = i.check(matches(not(isDisplayed())));
            return ret;
        }
    }
}
