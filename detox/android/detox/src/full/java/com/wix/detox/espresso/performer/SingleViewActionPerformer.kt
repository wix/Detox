package com.wix.detox.espresso.performer

import com.wix.detox.espresso.ViewActionWithResult

import android.view.View
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.NoMatchingViewException
import androidx.test.espresso.ViewAction
import androidx.test.espresso.matcher.RootMatchers
import org.hamcrest.Matcher

class SingleViewActionPerformer(
    private val action: ViewAction
) : ViewActionPerformer {
    override fun performOn(matcher: Matcher<View>): Any? {
        try {
            onView(matcher).perform(action)
        } catch (e: NoMatchingViewException) {
            // Fallback: try dialog root (e.g. React Native Modal)
            onView(matcher).inRoot(RootMatchers.isDialog()).perform(action)
        }

        return (action as? ViewActionWithResult<*>)?.getResult()
    }
}
