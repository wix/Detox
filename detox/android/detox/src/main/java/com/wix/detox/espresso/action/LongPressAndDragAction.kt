package com.wix.detox.espresso.action

import android.graphics.Point
import android.util.Log
import android.view.View
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.matcher.ViewMatchers
import com.wix.detox.espresso.scroll.LinearSwiper
import org.hamcrest.Matcher
import kotlin.math.ceil


private const val SLOW_SCROLL_MOTIONS = 50
private const val FAST_SCROLL_MOTIONS = 20

class LongPressAndDragAction(
    private val duration: Int,
    private val normalizedPositionX: Double,
    private val normalizedPositionY: Double,
    private val targetView: View,
    private val normalizedTargetPositionX: Double,
    private val normalizedTargetPositionY: Double,
    isFast: Boolean,
    private val holdDuration: Int
) : ViewAction {

    private val scrollMotions = if (isFast) FAST_SCROLL_MOTIONS else SLOW_SCROLL_MOTIONS

    override fun getDescription(): String {
        return "longPressAndDrag"
    }

    override fun getConstraints(): Matcher<View> {
        return ViewMatchers.isAssignableFrom(
            View::class.java
        )
    }

    override fun perform(uiController: UiController, view: View) {
        performSwipe(uiController, view, targetView)
    }

    private fun performSwipe(uiController: UiController, sourceView: View, targetView: View) {
        val xy = IntArray(2)

        // Get start coordinates
        sourceView.getLocationOnScreen(xy)
        val sourceViewPoint = Point(xy[0], xy[1])
        val startPoint = Point(
            ceil(sourceViewPoint.x + sourceView.width * normalizedPositionX).toInt(),
            ceil(sourceViewPoint.y + sourceView.height * normalizedPositionY).toInt()
        )

        // Get end coordinates
        targetView.getLocationOnScreen(xy)
        val targetViewPoint = Point(xy[0], xy[1])
        val endPoint = Point(
            ceil(targetViewPoint.x + targetView.width * normalizedTargetPositionX).toInt(),
            ceil(targetViewPoint.y + targetView.height * normalizedTargetPositionY).toInt()
        )

        Log.d(
            "LongPressAndDragAction",
            "start:$startPoint, end:$endPoint duration: $duration, holdDuration: $holdDuration, scrollMotions: $scrollMotions, source:[$sourceViewPoint,${sourceView.width}x${sourceView.height}], target:[$targetViewPoint,${targetView.width}x${targetView.height}]"
        )

        val swiper = LinearSwiper(uiController)
        val swipe = DetoxSwipeWithLongPress(
            duration,
            holdDuration,
            startPoint.x.toFloat(),
            startPoint.y.toFloat(),
            endPoint.x.toFloat(),
            endPoint.y.toFloat(),
            scrollMotions,
            swiper
        )
        swipe.perform()

        sourceView.getLocationOnScreen(xy)

        // Please note that the actual coordinates are not the same as the end coordinates.
        Log.d(
            "LongPressAndDragAction",
            "Performed swipe. Actual coordinates x=${xy[0]}, y=${xy[1]}. Normalized position x=${xy[0] + sourceView.width * normalizedTargetPositionX}, y=${xy[1] + sourceView.height * normalizedTargetPositionX}"
        )
    }
}
