package com.wix.detox.espresso.scroll

import android.view.View
import androidx.test.espresso.ViewAction
import androidx.test.espresso.action.*
import com.wix.detox.common.DetoxErrors
import com.wix.detox.espresso.common.annot.*
import com.wix.detox.espresso.utils.AgnosticPoint2D
import kotlin.math.min
import kotlin.math.max

private const val EDGE_FUZZ_FACTOR = 0.083f

typealias CreateSwipeAction = (
        swiper: Swiper,
        startCoordinatesProvider: CoordinatesProvider,
        endCoordinatesProvider: CoordinatesProvider,
        precisionDescriber: PrecisionDescriber
) -> ViewAction

class SwipeHelper(private val createAction: CreateSwipeAction) {

    fun swipeInDirection(
            direction: Int,
            fast: Boolean = true,
            offset: Double = Double.NaN,
            startPositionX: Double = Double.NaN,
            startPositionY: Double = Double.NaN
    ): ViewAction {
        val unsafeStartingPoint = AgnosticPoint2D.fromDoubles(startPositionX, startPositionY, direction)
        val startingPoint = getSafeStartingPoint(unsafeStartingPoint, direction)
        val start = translateFrom(startingPoint, direction)
        val end = translateTo(startingPoint, direction, offset)
        val swiper = if (fast) Swipe.FAST else Swipe.SLOW

        return this.createAction(swiper, start, end, Press.FINGER)
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
        val absoluteStart = AgnosticPoint2D.fromFloats(
                xy[0] + relativeStartF.x * view.width,
                xy[1] + relativeStartF.y * view.height,
                direction
        )
        val screenEdge = getScreenEdge(view, direction)
        val offset = safeProportion(unsafeOffset, 1.0)
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

    companion object {
        val default = SwipeHelper { swiper: Swiper,
                                    startCoordinatesProvider: CoordinatesProvider,
                                    endCoordinatesProvider: CoordinatesProvider,
                                    precisionDescriber: PrecisionDescriber ->
            ViewActions.actionWithAssertions(
                    GeneralSwipeAction(
                            swiper,
                            startCoordinatesProvider,
                            endCoordinatesProvider,
                            precisionDescriber
                    )
            );
        }

        const val edgeFuzzFactor = EDGE_FUZZ_FACTOR
    }
}