package com.wix.detox.espresso.performer

import com.wix.detox.espresso.DetoxMatcher
import com.wix.detox.espresso.ViewActionWithResult
import com.wix.detox.espresso.errors.DetoxNoMatchingViewException

import android.view.View
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.NoMatchingViewException
import androidx.test.espresso.ViewAction
import androidx.test.espresso.matcher.RootMatchers
import org.hamcrest.Matcher

class MultipleViewsActionPerformer(
    private val action: ViewAction
) : ViewActionPerformer {
    override fun performOn(matcher: Matcher<View>): Any? {
        val results = mutableListOf<Any?>()
        var index = 0

        while (true) {
            val indexedMatcher = DetoxMatcher.matcherForAtIndex(index, matcher)

            try {
                try {
                    onView(indexedMatcher).perform(action)
                } catch (e: NoMatchingViewException) {
                    // Fallback: try dialog root (e.g. React Native Modal)
                    onView(indexedMatcher).inRoot(RootMatchers.isDialog()).perform(action)
                }

                (action as? ViewActionWithResult<*>)?.getResult()?.let { results.add(it) }

                index++
            } catch (e: DetoxNoMatchingViewException) {
                if (index == 0) {
                    throw e
                }

                break
            }
        }

        return when {
            results.isEmpty() -> null
            results.size == 1 -> results.first()
            else -> mapOf("elements" to results)
        }
    }
}
