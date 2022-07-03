package com.wix.detox.espresso

import android.view.View
import androidx.test.espresso.*
import org.hamcrest.Matcher

class DetoxViewInteraction(private val viewMatcher: Matcher<View>) {
    private var viewInteraction: ViewInteraction = Espresso.onView(viewMatcher)

    fun performSingleViewAction(viewAction: ViewAction): Any? {
        kotlin.run {
            Espresso.onView(viewMatcher)
                .perform(viewAction)
        }

        return if (viewAction is ViewActionWithResult<*>) {
            viewAction.getResult()
        } else {
            null
        }
    }

    fun perform(viewAction: ViewAction): Any? {
        return if (MultiViewAction::class.java.isAssignableFrom(viewAction::class.java))
            return (viewAction as MultiViewAction<*>).perform(viewMatcher)
        else
            performSingleViewAction(viewAction)
    }

    fun withFailureHandler(failureHandler: FailureHandler): ViewInteraction {
        return viewInteraction.withFailureHandler(failureHandler)
    }

    fun inRoot(rootMatcher: Matcher<Root>): ViewInteraction {
        return viewInteraction.inRoot(rootMatcher)
    }

    fun noActivity(): ViewInteraction {
        return viewInteraction.noActivity()
    }

    fun check(viewAssert: ViewAssertion): ViewInteraction {
        return viewInteraction.check(viewAssert)
    }
}
