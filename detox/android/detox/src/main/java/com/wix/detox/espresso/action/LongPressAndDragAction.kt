package com.wix.detox.espresso.action

import android.util.Log
import android.view.View
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.ViewInteraction
import androidx.test.espresso.action.CoordinatesProvider
import androidx.test.espresso.action.GeneralLocation
import androidx.test.espresso.action.GeneralSwipeAction
import androidx.test.espresso.action.Press
import androidx.test.espresso.action.Swipe
import androidx.test.espresso.matcher.ViewMatchers
import com.wix.detox.espresso.action.common.utils.getView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.hamcrest.Matcher

class LongPressAndDragAction(
    private val normalizedPositionX: Double,
    private val normalizedPositionY: Double,
    private val targetElement: ViewInteraction,
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
        scope.launch {
            val targetView = targetElement.getView()

            val xy = IntArray(2)

            // Get start coordinates
            view.getLocationOnScreen(xy)
            val startX = xy[0] + view.width * normalizedPositionX
            val startY = xy[1] + view.height * normalizedPositionY

            // Get end coordinates
            targetView.getLocationOnScreen(xy)
            val endX = xy[0] + targetView.width * normalizedTargetPositionX
            val endY = xy[1] + targetView.height * normalizedTargetPositionY

            Log.d("LongPressAndDragAction", "startX: $startX, startY: $startY, endX: $endX, endY: $endY")


        }
    }

}
