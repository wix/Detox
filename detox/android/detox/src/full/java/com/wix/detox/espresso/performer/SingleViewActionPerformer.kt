package com.wix.detox.espresso.performer

import com.wix.detox.espresso.ViewActionWithResult

import android.view.View
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.NoMatchingViewException
import androidx.test.espresso.ViewAction
import org.hamcrest.Matcher

class SingleViewActionPerformer(
    private val action: ViewAction
) : ViewActionPerformer {
    override fun performOn(matcher: Matcher<View>): Any? {
        onView(matcher).perform(action)

        return (action as? ViewActionWithResult<*>)?.getResult()
    }
}
