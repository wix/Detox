package com.wix.detox.espresso.action

import android.util.Log
import android.view.View
import android.view.ViewConfiguration
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.matcher.ViewMatchers
import com.wix.detox.espresso.scroll.LinearSwiper
import org.hamcrest.Matcher
import kotlin.math.ceil


class LongPressAndDragAction(
    private val duration: Int,
    private val normalizedPositionX: Double,
    private val normalizedPositionY: Double,
    private val targetView: View,
    private val normalizedTargetPositionX: Double,
    private val normalizedTargetPositionY: Double,
    private val isFast: Boolean,
    private val holdDuration: Int
) : ViewAction {

    private val scrollMotions = if (isFast) 18 else 50


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
        val sourceX = xy[0]
        val sourceY = xy[1]
        val startX = ceil(sourceX + sourceView.width * normalizedPositionX)
        val startY = ceil(sourceY + sourceView.height * normalizedPositionY)

        // Get end coordinates
        targetView.getLocationOnScreen(xy)
        val targetX = xy[0]
        val targetY = xy[1]
        val endX = ceil(targetX + targetView.width * normalizedTargetPositionX)
        val endY = ceil(targetY + targetView.height * normalizedTargetPositionY)

        Log.d(
            "LongPressAndDragAction",
            "start:($startX,$startY), end:($endX,$endY) duration: $duration, holdDuration: $holdDuration, scrollMotions: $scrollMotions, source:($sourceX,$sourceY,${sourceView.width},${sourceView.height}), target:($targetX,$targetY,${targetView.width},${targetView.height})"
        )

        val swiper = LinearSwiper(uiController)
        val swipe = DetoxSwipeWithLongPress(
            duration,
            holdDuration,
            startX.toFloat(),
            startY.toFloat(),
            endX.toFloat(),
            endY.toFloat(),
            scrollMotions,
            swiper
        )
        swipe.perform()

        sourceView.getLocationOnScreen(xy)

        Log.d(
            "LongPressAndDragAction",
            "Performed swipe. Actual coordinates x=${xy[0]}, y=${xy[1]}. Normalized position x=${xy[0] + sourceView.width * normalizedTargetPositionX}, y=${xy[1] + sourceView.height * normalizedTargetPositionX}"
        )
    }
}
