package com.wix.detox.espresso;

import android.view.View;

import org.hamcrest.Matcher;

import static android.support.test.espresso.Espresso.onView;
import static android.support.test.espresso.assertion.ViewAssertions.matches;
import static android.support.test.espresso.matcher.ViewMatchers.isDisplayed;
import static android.support.test.espresso.matcher.ViewMatchers.withText;

/**
 * Created by rotemm on 26/12/2016.
 */

public class EspressoDetox {

    public static void assertViewExists(String text) {
        onView(withText(text)).check(matches(isDisplayed()));
    }

    public static Matcher<View> matcherForText(String text) {
        return withText(text);
    }


}
