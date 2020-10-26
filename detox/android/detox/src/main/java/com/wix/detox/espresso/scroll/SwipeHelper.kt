package com.wix.detox.espresso.scroll

import androidx.test.espresso.ViewAction
import androidx.test.espresso.action.*
import com.wix.detox.espresso.common.annot.*
import com.wix.detox.espresso.utils.*
import kotlin.math.abs
import kotlin.math.min
import kotlin.math.max

private const val EDGE_FUZZ_FACTOR = 0.083

private fun minMax(minValue: Double, value: Double, maxValue: Double) = max(minValue, min(value, maxValue))

private fun ifNaN(value: Double, fallback: Double) = when {
    value.isNaN() -> fallback
    else -> value
}

typealias CreateSwipeAction = (
        swiper: Swiper,
        startCoordinatesProvider: CoordinatesProvider,
        endCoordinatesProvider: CoordinatesProvider,
        precisionDescriber: PrecisionDescriber
) -> ViewAction

class SwipeHelper(private val createAction: CreateSwipeAction) {

    fun swipeInDirection(
            direction: Int,
            fast: Boolean,
            normalizedSwipeAmount: Double,
            normalizedStartingPointX: Double,
            normalizedStartingPointY: Double
    ): ViewAction {
        val (edgeMin, edgeMax) = Pair(EDGE_FUZZ_FACTOR, 1.0 - EDGE_FUZZ_FACTOR)
        val defaultNormalizedStartingPoint = Vector2D(0.5, edgeMin).rotate(direction, MOTION_DIR_DOWN).normalize()
        val safeNormalizedStartPoint = Vector2D(
                minMax(edgeMin, ifNaN(normalizedStartingPointX, defaultNormalizedStartingPoint.x), edgeMax),
                minMax(edgeMin, ifNaN(normalizedStartingPointY, defaultNormalizedStartingPoint.y), edgeMax)
        )

        val safeSwipeAmount = minMax(0.0, ifNaN(normalizedSwipeAmount, 0.75), 1.0)
        val startCoordinatesProvider = buildStartCoordinatesProvider(safeNormalizedStartPoint)
        val endCoordinatesProvider = buildEndCoordinatesProvider(startCoordinatesProvider, direction, safeSwipeAmount)
        val swiper = if (fast) Swipe.FAST else Swipe.SLOW

        return this.createAction(swiper, startCoordinatesProvider, endCoordinatesProvider, Press.FINGER)
    }

    private fun buildStartCoordinatesProvider(normalizedStartPoint: Vector2D) = CoordinatesProvider { view ->
        val xy = GeneralLocation.TOP_LEFT.calculateCoordinates(view)
        xy[0] += (normalizedStartPoint.x * view.width).toFloat()
        xy[1] += (normalizedStartPoint.y * view.height).toFloat()
        xy
    }

    private fun buildEndCoordinatesProvider(startCoordinatesProvider: CoordinatesProvider, direction: Int, normalizedSwipeAmount: Double) =
            CoordinatesProvider { view ->
                val xy = startCoordinatesProvider.calculateCoordinates(view)

                val screenEdge = Vector2D.from(
                        view.context.resources.displayMetrics.widthPixels,
                        view.context.resources.displayMetrics.heightPixels
                )

                val additionVector = Vector2D(0.0, normalizedSwipeAmount).rotate(direction, MOTION_DIR_DOWN)
                val swipeEnd = Vector2D.from(xy)
                        .add(screenEdge.scale(additionVector))
                        .trimMax(0.0, 0.0)
                        .trimMin(screenEdge.x, screenEdge.y)

                xy[0] = swipeEnd.x.toFloat()
                xy[1] = swipeEnd.y.toFloat()
                xy
            }

    companion object {
        @JvmStatic
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

        const val edgeFuzzFactor = EDGE_FUZZ_FACTOR.toFloat()
    }
}
