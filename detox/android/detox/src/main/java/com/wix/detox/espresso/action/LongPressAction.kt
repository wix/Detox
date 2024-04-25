package com.wix.detox.espresso.action

import android.graphics.Point
import android.view.View
import android.os.SystemClock
import android.view.MotionEvent
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import org.hamcrest.Matcher
import org.hamcrest.Matchers.allOf
import kotlin.math.ceil

class LongPressAction(
    private val duration: Int,
    private val x: Int?,
    private val y: Int?
) : ViewAction {

    override fun getDescription(): String {
        return "longPress"
    }

    override fun getConstraints(): Matcher<View> {
        return allOf(isAssignableFrom(View::class.java), isDisplayed())
    }

    override fun perform(uiController: UiController, view: View) {
        val sourceViewPoint = IntArray(2)
        view.getLocationOnScreen(sourceViewPoint)

        val tapPoint = Point(
            sourceViewPoint[0] + (x ?: view.width / 2),
            sourceViewPoint[1] + (y ?: view.height / 2)
        )

        val downTime = SystemClock.uptimeMillis()
        val eventList = mutableListOf<MotionEvent>()

        eventList.add(
            MotionEvent.obtain(
                downTime,
                downTime,
                MotionEvent.ACTION_DOWN,
                tapPoint.x.toFloat(),
                tapPoint.y.toFloat(),
                0
            )
        )

        eventList.add(
            MotionEvent.obtain(
                downTime,
                downTime + duration,
                MotionEvent.ACTION_MOVE,
                tapPoint.x.toFloat(),
                tapPoint.y.toFloat(),
                0
            )
        )

        eventList.add(
            MotionEvent.obtain(
                downTime,
                downTime + duration,
                MotionEvent.ACTION_UP,
                tapPoint.x.toFloat(),
                tapPoint.y.toFloat(),
                0
            )
        )

        uiController.injectMotionEventSequence(eventList)
        eventList.forEach { it.recycle() }
    }
}
