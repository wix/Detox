package com.wix.detox.espresso.performer

import com.wix.detox.espresso.MultipleViewsAction

import android.view.View
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.NoMatchingViewException
import androidx.test.espresso.ViewAction
import org.hamcrest.Matcher

interface ViewActionPerformer {
    fun performOn(matcher: Matcher<View>): Any?

    companion object {
        @JvmStatic
        fun forAction(action: ViewAction): ViewActionPerformer {
            return if (action is MultipleViewsAction) {
                MultipleViewsActionPerformer(action)
            } else {
                SingleViewActionPerformer(action)
            }
        }
    }
}
