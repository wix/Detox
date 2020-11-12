package com.wix.detox.espresso.scroll

import android.view.View
import androidx.test.espresso.ViewAction
import androidx.test.espresso.action.*
import com.wix.detox.common.DetoxErrors
import com.wix.detox.espresso.common.annot.*
import com.wix.detox.espresso.utils.AgnosticPoint2D
import kotlin.math.min
import kotlin.math.max

object SwipeHelper {
    fun swipeFastInDirection(direction: Int) = when (direction) {
        MOTION_DIR_LEFT -> ViewActions.swipeLeft()
        MOTION_DIR_RIGHT -> ViewActions.swipeRight()
        MOTION_DIR_UP -> ViewActions.swipeUp()
        MOTION_DIR_DOWN -> ViewActions.swipeDown()
        else -> throw DetoxErrors.DetoxIllegalArgumentException("Unsupported swipe direction: $direction")
    }

    fun swipeCustomInDirection(direction: Int, fast: Boolean, offset: Double, startPositionX: Double, startPositionY: Double): ViewAction? {
        val unsafeStartingPoint = AgnosticPoint2D.fromDoubles(startPositionX, startPositionY, direction)
        val startingPoint = getSafeStartingPoint(unsafeStartingPoint, direction)
        val start = translateFrom(startingPoint, direction)
        val end = translateTo(startingPoint, direction, offset)
        val swiper = if (fast) Swipe.FAST else Swipe.SLOW
        val swipeAction = GeneralSwipeAction(swiper, start, end, Press.FINGER)
        return ViewActions.actionWithAssertions(swipeAction)
    }

    private fun getSafeStartingPoint(unsafeStartingPoint: AgnosticPoint2D, direction: Int): AgnosticPoint2D {
        val isDescendingMove = direction == MOTION_DIR_UP || direction == MOTION_DIR_LEFT
        val safeEdge = if (isDescendingMove)
            1.0 - EDGE_FUZZ_FACTOR
        else
            0.0 + EDGE_FUZZ_FACTOR

        return AgnosticPoint2D(
                safeProportion(unsafeStartingPoint.primary, safeEdge),
                safeProportion(unsafeStartingPoint.secondary, 0.5)
        )
    }

    private fun safeProportion(value: Double, nanFallback: Double): Double {
        return if (value.equals(Double.NaN)) {
            nanFallback
        } else {
            max(0.0, min(value, 1.0))
        }
    }

    private fun translateFrom(relativeStart: AgnosticPoint2D, direction: Int) = CoordinatesProvider { view ->
        val relativeStartF = relativeStart.toFloatingPoint(direction);
        val xy = GeneralLocation.TOP_LEFT.calculateCoordinates(view)
        xy[0] += relativeStartF.x * view.width
        xy[1] += relativeStartF.y * view.height
        xy
    }

    private fun translateTo(relativeStart: AgnosticPoint2D, direction: Int, unsafeOffset: Double) = CoordinatesProvider { view ->
        val relativeStartF = relativeStart.toFloatingPoint(direction)
        val xy = GeneralLocation.TOP_LEFT.calculateCoordinates(view)
        var absoluteStart = AgnosticPoint2D.fromFloats(
                xy[0] + relativeStartF.x * view.width,
                xy[1] + relativeStartF.y * view.height,
                direction
        )
        var screenEdge = getScreenEdge(view, direction)
        val offset = safeProportion(unsafeOffset, 1.0 - EDGE_FUZZ_FACTOR)
        val end = AgnosticPoint2D(
                absoluteStart.primary + (screenEdge - absoluteStart.primary) * offset,
                absoluteStart.secondary
        )
        val endF = end.toFloatingPoint(direction)

        xy[0] = endF.x
        xy[1] = endF.y
        xy
    }

    private fun getScreenEdge(view: View, direction: Int) = when (direction) {
        MOTION_DIR_LEFT, MOTION_DIR_UP -> 0
        MOTION_DIR_RIGHT -> view.context.resources.displayMetrics.widthPixels
        MOTION_DIR_DOWN -> view.context.resources.displayMetrics.heightPixels
        else -> throw DetoxErrors.DetoxIllegalArgumentException("Unsupported swipe direction: $direction")
    }

    private const val EDGE_FUZZ_FACTOR = 0.083f
}