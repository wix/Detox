@file:JvmName("ViewMatchers")

package com.wix.detox.espresso.matcher

import android.view.View
import androidx.appcompat.widget.AppCompatSeekBar
import androidx.test.espresso.matcher.BoundedMatcher
import androidx.test.espresso.matcher.ViewMatchers
import androidx.test.espresso.matcher.ViewMatchers.withEffectiveVisibility
import com.facebook.react.views.slider.ReactSlider
import com.wix.detox.espresso.action.common.ReflectUtils
import org.hamcrest.BaseMatcher
import org.hamcrest.Description
import org.hamcrest.Matcher
import org.hamcrest.Matchers.allOf
import org.hamcrest.TypeSafeMatcher

/*
 * An extension of [androidx.test.espresso.matcher.ViewMatchers].
 */

private const val CLASS_REACT_SLIDER_LEGACY = "com.facebook.react.views.slider.ReactSlider"
private const val CLASS_REACT_SLIDER_COMMUNITY = "com.reactnativecommunity.slider.ReactSlider"

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

fun toHaveSliderPosition(expectedValue: Double, tolerance: Double): Matcher<View?> {
    return object : BoundedMatcher<View?, View>(AppCompatSeekBar::class.java) {
        override fun describeTo(description: Description) {
            description.appendText("expected: $expectedValue")
        }

        override fun matchesSafely(view: View?): Boolean {
            val castView = view as AppCompatSeekBar
            val currentProgress = castView.progress
            val sliderProgress = when {
                (ReflectUtils.isObjectAssignableFrom(view, CLASS_REACT_SLIDER_LEGACY)) ->
                    (view as ReactSlider).toRealProgress(currentProgress)
                (ReflectUtils.isObjectAssignableFrom(view, CLASS_REACT_SLIDER_COMMUNITY)) ->
                    (view as com.reactnativecommunity.slider.ReactSlider).toRealProgress(currentProgress)
                else -> (view as ReactSlider).toRealProgress(currentProgress)
            }
            val currentPctFactor = castView.max / currentProgress.toDouble()
            val realTotal = sliderProgress * currentPctFactor
            val actualValue = sliderProgress / realTotal
            return Math.abs(actualValue - expectedValue) <= tolerance
        }
    }
}
