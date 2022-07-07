package com.wix.detox.espresso

import android.view.View
import androidx.test.espresso.*
import org.hamcrest.Matcher

class DetoxViewInteraction(private val viewMatcher: Matcher<View>) {
    private val espressoInteraction: ViewInteraction = Espresso.onView(viewMatcher)

    fun perform(viewAction: ViewAction): Any? {
        return when (viewAction) {
            is MultiViewActionWithResult<*> -> viewAction.performOnView(viewMatcher)
            is ViewActionWithResult<*> -> performSingleViewActionWithResult(viewAction)
            else -> performSingleViewAction(viewAction)
        }
    }

    private fun performSingleViewActionWithResult(viewAction: ViewActionWithResult<*>): Any? {
        espressoInteraction.perform(viewAction)
        return viewAction.getResult()
    }

    private fun performSingleViewAction(viewAction: ViewAction): Unit? {
        espressoInteraction.perform(viewAction)
        return null
    }

    fun withFailureHandler(failureHandler: FailureHandler): ViewInteraction {
        return espressoInteraction.withFailureHandler(failureHandler)
    }

    fun inRoot(rootMatcher: Matcher<Root>): ViewInteraction {
        return espressoInteraction.inRoot(rootMatcher)
    }

    fun noActivity(): ViewInteraction {
        return espressoInteraction.noActivity()
    }

    fun check(viewAssert: ViewAssertion): ViewInteraction {
        return espressoInteraction.check(viewAssert)
    }
}
