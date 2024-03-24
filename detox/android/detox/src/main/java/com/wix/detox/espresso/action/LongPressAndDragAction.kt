package com.wix.detox.espresso.action

import android.util.Log
import android.view.View
import android.view.ViewConfiguration
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.matcher.ViewMatchers
import com.wix.detox.espresso.scroll.LinearSwiper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import org.hamcrest.Matcher
import kotlin.math.ceil


private const val SCROLL_MOTIONS = 50

class LongPressAndDragAction(
    private val duration: Int,
    private val normalizedPositionX: Double,
    private val normalizedPositionY: Double,
    private val targetView: View,
    private val normalizedTargetPositionX: Double,
    private val normalizedTargetPositionY: Double,
    private val speed: String,
    private val holdDuration: Int
) : ViewAction {

    private val scope = CoroutineScope(Dispatchers.Main)
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
        sourceView.getLocationInWindow(xy)
        val startX = ceil(xy[0] + sourceView.width * normalizedPositionX)
        val startY = ceil(xy[1] + sourceView.height * normalizedPositionY)

        // Get end coordinates
        targetView.getLocationInWindow(xy)
        val endX = ceil(xy[0] + targetView.width * normalizedTargetPositionX)
        val endY = ceil(xy[1] + targetView.height * normalizedTargetPositionY)

        Log.d(
            "LongPressAndDragAction",
            "startX: $startX, startY: $startY, endX: $endX, endY: $endY, duration: $duration, holdDuration: $holdDuration"
        )

        val swiper = LinearSwiper(SCROLL_MOTIONS, uiController, ViewConfiguration.get(sourceView.context))
        val swipe = DetoxSwipeWithLongPress(
            duration,
            holdDuration,
            startX.toFloat(),
            startY.toFloat(),
            endX.toFloat(),
            endY.toFloat(),
            SCROLL_MOTIONS,
            swiper
        )
        swipe.perform()
    }
}
