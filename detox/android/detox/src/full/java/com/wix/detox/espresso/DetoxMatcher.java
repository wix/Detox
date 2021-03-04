package com.wix.detox.espresso;

import android.view.View;

import org.hamcrest.Matcher;

import androidx.test.espresso.matcher.ViewMatchers.Visibility;

import static androidx.test.espresso.matcher.ViewMatchers.hasDescendant;
import static androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom;
import static androidx.test.espresso.matcher.ViewMatchers.isChecked;
import static androidx.test.espresso.matcher.ViewMatchers.isDescendantOfA;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayingAtLeast;
import static androidx.test.espresso.matcher.ViewMatchers.isNotChecked;
import static androidx.test.espresso.matcher.ViewMatchers.withContentDescription;
import static androidx.test.espresso.matcher.ViewMatchers.withEffectiveVisibility;
import static androidx.test.espresso.matcher.ViewMatchers.withTagValue;
import static androidx.test.espresso.matcher.ViewMatchers.withText;
import static com.wix.detox.espresso.matcher.ViewMatchers.isMatchingAtIndex;
import static com.wix.detox.espresso.matcher.ViewMatchers.isOfClassName;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.is;
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
        return allOf(withText(text), withEffectiveVisibility(Visibility.VISIBLE));
    }

    public static Matcher<View> matcherForContentDescription(String contentDescription) {
        return allOf(withContentDescription(contentDescription), withEffectiveVisibility(Visibility.VISIBLE));
    }

    public static Matcher<View> matcherForTestId(String testId) {
        return allOf(withTagValue(is((Object) testId)), withEffectiveVisibility(Visibility.VISIBLE));
    }

    public static Matcher<View> matcherForToggleable(boolean value) {
        return (value ? isChecked() : isNotChecked());
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
        return isOfClassName(className);
    }

    public static Matcher<View> matcherForSufficientlyVisible() {
        return isDisplayingAtLeast(75);
    }

    public static Matcher<View> matcherForNotVisible() {
        return anyOf(nullValue(), not(isDisplayed()));
    }

    public static Matcher<View> matcherForNotNull() {
        return notNullValue(android.view.View.class);
    }

    public static Matcher<View> matcherForNull() {
        return nullValue(android.view.View.class);
    }

    public static Matcher<View> matcherForAtIndex(final int index, final Matcher<View> innerMatcher) {
        return isMatchingAtIndex(index, innerMatcher);
    }

    public static Matcher<View> matcherForAnything() {
        return isAssignableFrom(View.class);
    }

}
