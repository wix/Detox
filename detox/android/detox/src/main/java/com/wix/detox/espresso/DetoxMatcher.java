package com.wix.detox.espresso;

import android.view.View;

import org.hamcrest.Matcher;

import static android.support.test.espresso.matcher.ViewMatchers.hasDescendant;
import static android.support.test.espresso.matcher.ViewMatchers.isAssignableFrom;
import static android.support.test.espresso.matcher.ViewMatchers.isDescendantOfA;
import static android.support.test.espresso.matcher.ViewMatchers.isDisplayed;
import static android.support.test.espresso.matcher.ViewMatchers.isDisplayingAtLeast;
import static android.support.test.espresso.matcher.ViewMatchers.withClassName;
import static android.support.test.espresso.matcher.ViewMatchers.withContentDescription;
import static android.support.test.espresso.matcher.ViewMatchers.withTagValue;
import static android.support.test.espresso.matcher.ViewMatchers.withText;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.any;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.isA;
import org.hamcrest.core.IsAnything;
import static org.hamcrest.Matchers.anything;
import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

/**
 * Created by simonracz on 10/07/2017.
 */

public class DetoxMatcher {

    private DetoxMatcher() {
        // static class
    }

    public static Matcher<View> matcherForText(String text) {
        // return anyOf(withText(text), withContentDescription(text));
        return withText(text);
    }

    public static Matcher<View> matcherForContentDescription(String contentDescription) {
        return withContentDescription(contentDescription);
    }

    public static Matcher<View> matcherForTestId(String testId) {
        return withTagValue(is((Object) testId));
    }

    public static Matcher<View> matcherForAnd(Matcher<View> m1, Matcher<View> m2) {
        return allOf(m1, m2);
    }

    public static Matcher<View> matcherForOr(Matcher<View> m1, Matcher<View> m2) {
        return anyOf(m1, m2);
    }

    public static Matcher<View> matcherForNot(Matcher<View> m) {
        return not(m);
    }

    public static Matcher<View> matcherWithAncestor(Matcher<View> m, Matcher<View> ancestorMatcher) {
        return allOf(m, isDescendantOfA(ancestorMatcher));
    }

    public static Matcher<View> matcherWithDescendant(Matcher<View> m, Matcher<View> descendantMatcher) {
        return allOf(m, hasDescendant(descendantMatcher));
    }

    public static Matcher<View> matcherForClass(String className) {
        try {
            Class cls = Class.forName(className);
            return isAssignableFrom(cls);
        } catch (ClassNotFoundException e) {
            // empty
        }
        return not(new IsAnything<View>());
    }

    public static Matcher<View> matcherForSufficientlyVisible() {
        return isDisplayingAtLeast(75);
    }

    public static Matcher<View> matcherForNotVisible() {
        return not(isDisplayed());
    }

    public static Matcher<View> matcherForNotNull() {
        return notNullValue(android.view.View.class);
    }

    public static Matcher<View> matcherForNull() {
        return nullValue(android.view.View.class);
    }

}
