package com.wix.detox.espresso

import android.view.View
import androidx.test.espresso.*
import org.hamcrest.Matcher

class DetoxViewInteraction(private val viewMatcher: Matcher<View>) {
    private val espressoInteraction: ViewInteraction = Espresso.onView(viewMatcher)

    fun perform(viewAction: ViewAction): Any? {
        return when (viewAction) {
            is MultipleViewsActionWithResult<*> -> viewAction.performOnView(viewMatcher)
            is ViewActionWithResult<*> -> performSingleViewActionWithResult(viewAction)
            else -> performSingleViewAction(viewAction)
        }
    }

    fun check(viewAssert: ViewAssertion): ViewInteraction =
        espressoInteraction.check(viewAssert)

    private fun performSingleViewActionWithResult(viewAction: ViewActionWithResult<*>): Any? {
        espressoInteraction.perform(viewAction)
        return viewAction.getResult()
    }

    private fun performSingleViewAction(viewAction: ViewAction): Unit? {
        espressoInteraction.perform(viewAction)
        return null
    }
}
