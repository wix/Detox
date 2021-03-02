package com.wix.detox.espresso.matcher

import android.view.View
import org.hamcrest.BaseMatcher
import org.hamcrest.Description
import org.hamcrest.Matcher

class ViewAtIndexMatcher(private val index: Int, private val innerMatcher: Matcher<View>) : BaseMatcher<View>() {
    private var foundMatch = false
    private var count = 0

    override fun matches(item: Any): Boolean {
        if (!innerMatcher.matches(item) || foundMatch) return false

        if (count == index) {
            foundMatch = true
            return true
        }
        ++count
        return false
    }

    override fun describeTo(description: Description) {
        description.appendText("matches " + index + "th view.")
    }
}
