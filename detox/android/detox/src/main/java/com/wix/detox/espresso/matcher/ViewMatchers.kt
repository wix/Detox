package com.wix.detox.espresso.matcher

import android.view.View
import androidx.test.espresso.matcher.ViewMatchers
import androidx.test.espresso.matcher.ViewMatchers.*
import org.hamcrest.BaseMatcher
import org.hamcrest.Description

import org.hamcrest.Matcher
import org.hamcrest.Matchers.*

/*
 * An extension of [androidx.test.espresso.matcher.ViewMatchers].
 */

fun isOfClassName(className: String): Matcher<View> {
    try {
        val cls = Class.forName(className)
        return allOf(isAssignableFrom(cls as Class<out View>?), withEffectiveVisibility(ViewMatchers.Visibility.VISIBLE))
    } catch (e: ClassNotFoundException) {
        // empty
    }

    return object : BaseMatcher<View>() {
        override fun matches(item: Any): Boolean {
            return false
        }

        override fun describeTo(description: Description) {
            description.appendText("Class $className not found on classpath. Are you using full class name?")
        }
    }
}

fun isMatchingAtIndex(index: Int, innerMatcher: Matcher<View>): Matcher<View> = ViewAtIndexMatcher(index, innerMatcher)
