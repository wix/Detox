package com.wix.detox.espresso.performer

import com.wix.detox.espresso.DetoxMatcher
import com.wix.detox.espresso.ViewActionWithResult

import android.view.View
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.NoMatchingViewException
import androidx.test.espresso.ViewAction
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
                onView(indexedMatcher).perform(action)

                (action as? ViewActionWithResult<*>)?.getResult()?.let { results.add(it) }

                index++
            } catch (e: NoMatchingViewException) {
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
