@file:JvmName("ViewInteractionExt")
package com.wix.detox.espresso.action.common.utils

import android.view.View
import androidx.test.espresso.ViewAction
import androidx.test.espresso.ViewInteraction
import org.hamcrest.Matcher
import org.hamcrest.Matchers


fun ViewInteraction.getView(): View  {
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

    return result ?: throw IllegalStateException("Failed to get view")
}

