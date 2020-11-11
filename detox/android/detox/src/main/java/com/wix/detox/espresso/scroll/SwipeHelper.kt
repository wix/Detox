package com.wix.detox.espresso.scroll

import androidx.test.espresso.ViewAction
import androidx.test.espresso.action.*
import com.wix.detox.common.DetoxErrors
import com.wix.detox.espresso.common.annot.*
import kotlin.math.min
import kotlin.math.max
import kotlin.math.sign

typealias Point = Pair<Double, Double>

object SwipeHelper {
    fun swipeFastInDirection(direction: Int) = when (direction) {
        MOTION_DIR_LEFT -> ViewActions.swipeLeft()
        MOTION_DIR_RIGHT -> ViewActions.swipeRight()
        MOTION_DIR_UP -> ViewActions.swipeUp()
        MOTION_DIR_DOWN -> ViewActions.swipeDown()
        else -> throw DetoxErrors.DetoxIllegalArgumentException("Unsupported swipe direction: $direction")
    }

    fun swipeCustomInDirection(direction: Int, fast: Boolean, offset: Double, startPositionX: Double, startPositionY: Double): ViewAction? {
        val swiper = if (fast) Swipe.FAST else Swipe.SLOW
        val (from, to) = calculateSwipe(direction, offset, startPositionX, startPositionY)
        val start = translate(from)
        val end = translate(to)
        val swipeAction = GeneralSwipeAction(swiper, start, end, Press.FINGER)
        return ViewActions.actionWithAssertions(swipeAction)
    }

    fun calculateSwipe(
            direction: Int,
            unsafeOffset: Double = Double.NaN,
            unsafeStartX: Double = Double.NaN,
            unsafeStartY: Double = Double.NaN
    ): Pair<Point, Point> {
        val isHorizontal = direction == MOTION_DIR_LEFT || direction == MOTION_DIR_RIGHT
        val isVertical = direction == MOTION_DIR_UP || direction == MOTION_DIR_DOWN
        val isDescending = direction == MOTION_DIR_UP || direction == MOTION_DIR_LEFT

        if (!isHorizontal && !isVertical) {
            throw DetoxErrors.DetoxIllegalArgumentException("Unsupported swipe direction: $direction")
        }

        var offset = safeProportion(unsafeOffset, 0.5 + EDGE_FUZZ_FACTOR);
        if (isDescending) {
            offset *= -1
        }

        val startPrimary = safeProportion(
                if (isHorizontal) unsafeStartX else unsafeStartY,
                0.5 - sign(offset) * EDGE_FUZZ_FACTOR
        )

        val startSecondary = safeProportion(
                if (isVertical) unsafeStartX else unsafeStartY,
                0.5
        )

        val (from, to) = getPrimaryAxisMove(offset, startPrimary);
        val fromPoint = if (isHorizontal) Pair(from, startSecondary) else Pair(startSecondary, from)
        val toPoint =   if (isHorizontal) Pair(to,   startSecondary) else Pair(startSecondary, to)

        return Pair(fromPoint, toPoint)
    }

    private fun safeProportion(value: Double, nanFallback: Double): Double {
        return if (value.equals(Double.NaN)) {
            nanFallback
        } else {
            max(0.0, min(value, 1.0))
        }
    }

    private fun getPrimaryAxisMove(offset: Double, start: Double): Pair<Double, Double> {
        val from = if (offset > 0.0) {
            min(start, 1.0 - offset)
        } else {
            max(start, -offset)
        }

        val to = if (offset > 0.0) {
            min(1.0, from + offset)
        } else {
            max(0.0, from + offset)
        }

        return Pair(from, to);
    }

    private fun translate(point: Point) = CoordinatesProvider { view ->
        val (dx, dy) = point
        val xy = GeneralLocation.TOP_LEFT.calculateCoordinates(view)
        xy[0] += dx.toFloat() * view.width
        xy[1] += dy.toFloat() * view.height
        xy
    }

    private const val EDGE_FUZZ_FACTOR = 0.083f
}