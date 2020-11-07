package com.wix.detox.espresso.scroll

import androidx.test.espresso.ViewAction
import androidx.test.espresso.action.*
import com.wix.detox.espresso.common.annot.MOTION_DIR_DOWN
import com.wix.detox.espresso.common.annot.MOTION_DIR_LEFT
import com.wix.detox.espresso.common.annot.MOTION_DIR_RIGHT
import com.wix.detox.espresso.common.annot.MOTION_DIR_UP

object SwipeHelper {
    fun swipeFastInDirection(direction: Int): ViewAction? {
        return when (direction) {
            MOTION_DIR_LEFT -> ViewActions.swipeLeft()
            MOTION_DIR_RIGHT -> ViewActions.swipeRight()
            MOTION_DIR_UP -> ViewActions.swipeUp()
            MOTION_DIR_DOWN -> ViewActions.swipeDown()
            else -> throw RuntimeException("Unsupported swipe direction: $direction")
        }
    }

    fun swipeSlowInDirection(direction: Int): ViewAction? {
        return when (direction) {
            MOTION_DIR_LEFT -> ViewActions.actionWithAssertions(GeneralSwipeAction(Swipe.SLOW,
                    translate(GeneralLocation.CENTER_RIGHT, -EDGE_FUZZ_FACTOR, 0f),
                    GeneralLocation.CENTER_LEFT, Press.FINGER))
            MOTION_DIR_RIGHT -> ViewActions.actionWithAssertions(GeneralSwipeAction(Swipe.SLOW,
                    translate(GeneralLocation.CENTER_LEFT, EDGE_FUZZ_FACTOR, 0f),
                    GeneralLocation.CENTER_RIGHT, Press.FINGER))
            MOTION_DIR_UP -> ViewActions.actionWithAssertions(GeneralSwipeAction(Swipe.SLOW,
                    translate(GeneralLocation.BOTTOM_CENTER, 0f, -EDGE_FUZZ_FACTOR),
                    GeneralLocation.TOP_CENTER, Press.FINGER))
            MOTION_DIR_DOWN -> ViewActions.actionWithAssertions(GeneralSwipeAction(Swipe.SLOW,
                    translate(GeneralLocation.TOP_CENTER, 0f, EDGE_FUZZ_FACTOR),
                    GeneralLocation.BOTTOM_CENTER, Press.FINGER))
            else -> throw RuntimeException("Unsupported swipe direction: $direction")
        }
    }

    private fun translate(coords: CoordinatesProvider, dx: Float, dy: Float): CoordinatesProvider? {
        return CoordinatesProvider { view ->
            val xy = coords.calculateCoordinates(view)
            xy[0] += dx * view.width
            xy[1] += dy * view.height
            xy
        }
    }

    private const val EDGE_FUZZ_FACTOR = 0.083f
}