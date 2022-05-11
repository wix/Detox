@file:JvmName("ViewMatchers")

package com.wix.detox.espresso.matcher

import android.view.View
import androidx.appcompat.widget.AppCompatSeekBar
import androidx.test.espresso.matcher.BoundedMatcher
import androidx.test.espresso.matcher.ViewMatchers
import androidx.test.espresso.matcher.ViewMatchers.withEffectiveVisibility
import com.wix.detox.espresso.common.SliderHelper
import org.hamcrest.BaseMatcher
import org.hamcrest.Description
import org.hamcrest.Matcher
import org.hamcrest.Matchers.allOf
import org.hamcrest.TypeSafeMatcher
import kotlin.math.abs

/*
 * An extension of [androidx.test.espresso.matcher.ViewMatchers].
 */

fun isOfClassName(className: String): Matcher<View> {
    try {
        val cls = Class.forName(className)
        return allOf(IsAssignableFromMatcher(cls), withEffectiveVisibility(ViewMatchers.Visibility.VISIBLE))
    } catch (e: ClassNotFoundException) {
        // empty
    }

    return object : BaseMatcher<View>() {
        override fun matches(item: Any) = false
        override fun describeTo(description: Description) {
            description.appendText("Class $className not found on classpath. Are you using full class name?")
        }
    }
}

fun isMatchingAtIndex(index: Int, innerMatcher: Matcher<View>): Matcher<View> =
    ViewAtIndexMatcher(index, innerMatcher)

fun toHaveSliderPosition(expectedValuePct: Double, tolerance: Double): Matcher<View?> =
    object: BoundedMatcher<View?, AppCompatSeekBar>(AppCompatSeekBar::class.java) {
        override fun describeTo(description: Description) {
            description.appendText("sliderPositionPercent($expectedValuePct)")
        }

        override fun matchesSafely(view: AppCompatSeekBar): Boolean {
            val sliderHelper = SliderHelper.create(view)
            val progressPct = sliderHelper.getCurrentProgressPct()
            return (abs(progressPct - expectedValuePct) <= tolerance)
        }
    }

/**
 * Same as [androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom], but accepts any class. Needed
 * in order to avoid warning when passing 'any' class.
 * [TypeSafeMatcher] does the View-class type matching for us.
 */
private class IsAssignableFromMatcher(private val clazz: Class<*>) : TypeSafeMatcher<View>() {
    public override fun matchesSafely(view: View) = clazz.isAssignableFrom(view.javaClass)
    override fun describeTo(description: Description) {
        description.appendText("is assignable from class: $clazz")
    }
}
