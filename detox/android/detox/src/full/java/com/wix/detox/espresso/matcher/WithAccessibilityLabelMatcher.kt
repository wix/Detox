package com.wix.detox.espresso.matcher

import android.view.View
import com.wix.detox.reactnative.ui.getAccessibilityLabel
import org.hamcrest.Description
import org.hamcrest.Matcher
import org.hamcrest.TypeSafeDiagnosingMatcher

class WithAccessibilityLabelMatcher(private val textMatcher: Matcher<String>): TypeSafeDiagnosingMatcher<View>() {
    override fun matchesSafely(view: View, mismatchDescription: Description): Boolean =
        view.getAccessibilityLabel().let { contentDescription ->
            return textMatcher.matches(contentDescription).also { matched ->
                if (!matched) {
                    mismatchDescription.appendText("view.getAccessibilityLabel() ")
                    textMatcher.describeMismatch(contentDescription, mismatchDescription)
                }
            }
        }

    override fun describeTo(description: Description) {
        description.appendText("view.getAccessibilityLabel() ").appendDescriptionOf(textMatcher)
    }
}
