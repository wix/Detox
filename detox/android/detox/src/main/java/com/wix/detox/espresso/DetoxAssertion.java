package com.wix.detox.espresso;

import android.support.test.espresso.ViewInteraction;
import android.view.View;

import org.hamcrest.Matcher;

import static android.support.test.espresso.assertion.ViewAssertions.matches;

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
}
