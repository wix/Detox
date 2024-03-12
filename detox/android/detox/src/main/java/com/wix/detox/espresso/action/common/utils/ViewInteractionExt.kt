package com.wix.detox.espresso.action.common.utils

import android.view.View
import androidx.test.espresso.ViewAction
import androidx.test.espresso.ViewInteraction
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.hamcrest.Matcher
import org.hamcrest.Matchers


suspend fun ViewInteraction.getView(): View = withContext(Dispatchers.IO) {
    var result: View? = null

    val viewAction = object : ViewAction {
        override fun getDescription(): String {
            return "Get View"
        }

        override fun getConstraints(): Matcher<View> {
            return Matchers.any(View::class.java)
        }

        override fun perform(uiController: androidx.test.espresso.UiController, view: View) {
            result = view
        }
    }

    perform(viewAction)

    result ?: throw IllegalStateException("Failed to get view")
}

