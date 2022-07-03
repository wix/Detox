package com.wix.detox.espresso

import android.view.View
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import org.hamcrest.Matcher

class DetoxViewActionHelper {
    companion object {
        fun convertToDetoxViewAction(
            viewAction: ViewAction,
            multiViewEnabled: Boolean
        ): DetoxViewAction {
            return object : DetoxViewAction {
                override fun isMultiViewAction(): Boolean {
                    return multiViewEnabled
                }

                override fun getConstraints(): Matcher<View> {
                    return viewAction.constraints
                }

                override fun getDescription(): String {
                    return viewAction.description
                }

                override fun perform(uiController: UiController, view: View) {
                    viewAction.perform(uiController, view)
                }
            }
        }
    }
}