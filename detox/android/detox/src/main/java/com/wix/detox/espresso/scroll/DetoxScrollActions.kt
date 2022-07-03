package com.wix.detox.espresso.scroll

import android.view.View
import androidx.test.espresso.UiController
import androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import com.wix.detox.action.common.MotionDir
import com.wix.detox.common.DetoxErrors.DetoxRuntimeException
import com.wix.detox.common.DetoxErrors.StaleActionException
import com.wix.detox.espresso.DetoxViewAction
import org.hamcrest.Matcher
import org.hamcrest.Matchers.allOf

abstract class DetoxScrollActionBase internal constructor(
        @MotionDir
        private val direction: Int,
        private val amountInDp: Double,
        private val startOffsetPercentX: Float? = null,
        private val startOffsetPercentY: Float? = null)
    : DetoxViewAction {
    override fun getConstraints(): Matcher<View> = allOf(isAssignableFrom(View::class.java), isDisplayed())
    override fun perform(uiController: UiController?, view: View?) =
            ScrollHelper.perform(uiController, view, direction, amountInDp, startOffsetPercentX, startOffsetPercentY)
}

class DetoxScrollAction(@MotionDir direction: Int, amountInDp: Double, startOffsetPercentX: Float?, startOffsetPercentY: Float?)
    : DetoxScrollActionBase(direction, amountInDp, startOffsetPercentX, startOffsetPercentY) {

    override fun getDescription() = "scrollInDirection"
    override fun perform(uiController: UiController?, view: View?) {
        try {
            super.perform(uiController, view)
        } catch (e: Exception) {
            throw DetoxRuntimeException(e)
        }
    }

    override fun isMultiViewAction(): Boolean {
        return false
    }
}

class DetoxScrollActionStaleAtEdge(@MotionDir direction: Int, amountInDp: Double, startOffsetPercentX: Float?, startOffsetPercentY: Float?)
    : DetoxScrollActionBase(direction, amountInDp, startOffsetPercentX, startOffsetPercentY) {

    override fun getDescription() = "scrollInDirectionStaleAtEdge"

    override fun perform(uiController: UiController?, view: View?) {
        try {
            super.perform(uiController, view)
        } catch (exScrollAtEdge: ScrollEdgeException) {
            throw StaleActionException(exScrollAtEdge)
        }
    }

    override fun isMultiViewAction(): Boolean {
        return false
    }
}
