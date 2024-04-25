package com.wix.detox.espresso.action

import android.graphics.Point
import android.view.View
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.matcher.ViewMatchers
import org.hamcrest.Matcher
import kotlin.math.ceil

class LongPressAction(
    private val duration: Int,
    private val x: Int?,
    private val y: Int?
) : ViewAction {

    override fun getDescription(): String {
        return "longPressAndDrag"
    }

    override fun getConstraints(): Matcher<View> {
        return ViewMatchers.isAssignableFrom(View::class.java)
    }

    override fun perform(uiController: UiController, view: View) {
        var tapPoint: Point? = null

        if (x != null && y != null) {
            val sourceViewPoint = IntArray(2)
            view.getLocationOnScreen(sourceViewPoint)
            tapPoint = Point(sourceViewPoint[0] + x, sourceViewPoint[1] + y)
        }

        if (tapPoint != null) {
            uiController.injectMotionEventDown(tapPoint)
            uiController.loopMainThreadForAtLeast(duration.toLong())
            uiController.injectMotionEventUp(tapPoint)
        } else {
            uiController.longClick(view)
        }
    }
}
