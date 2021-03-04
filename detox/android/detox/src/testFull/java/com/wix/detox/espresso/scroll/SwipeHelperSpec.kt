package com.wix.detox.espresso.scroll

import android.content.Context
import android.content.res.Resources
import android.util.DisplayMetrics
import android.view.View
import androidx.test.espresso.ViewAction
import androidx.test.espresso.action.*
import com.nhaarman.mockitokotlin2.mock
import com.nhaarman.mockitokotlin2.whenever
import com.wix.detox.action.common.*
import com.wix.detox.espresso.common.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.Parameterized
import kotlin.test.assertEquals

data class SwipeArguments(
        val direction: Int,
        val fast: Boolean,
        val normalizedSwipeAmount: Double,
        val normalizedStartingPointX: Double,
        val normalizedStartingPointY: Double
)

data class SwipeCoordinates(
        val startX: Float,
        val startY: Float,
        val endX: Float,
        val endY: Float
)

data class RectangleCalculator(val x: Int, val y: Int, val width: Int, val height: Int, val fuzz: Float) {
    val left: Float get() = x + width * 0.0f
    val center: Float get() = x + width * 0.5f
    val right: Float get() = x + width * 1.0f
    val top: Float get() = y + height * 0.0f
    val middle: Float get() = y + height * 0.5f
    val bottom: Float get() = y + height * 1.0f

    val safeLeft: Float get() = x + width * (0f + fuzz)
    val safeRight: Float get() = x + width * (1f - fuzz)
    val safeTop: Float get() = y + height * (0f + fuzz)
    val safeBottom: Float get() = y + height * (1f - fuzz)
}

@RunWith(Parameterized::class)
class SwipeHelperTest(
        val args: SwipeArguments,
        val expected: SwipeCoordinates
) {
    lateinit var action: ViewAction
    lateinit var swiper: Swiper
    lateinit var startCoordinatesProvider: CoordinatesProvider
    lateinit var endCoordinatesProvider: CoordinatesProvider
    lateinit var precisionDescriber: PrecisionDescriber
    lateinit var swipeResult: Any

    private val swipeHelper = SwipeHelper { _swiper: Swiper,
                                            _startCoordinatesProvider: CoordinatesProvider,
                                            _endCoordinatesProvider: CoordinatesProvider,
                                            _precisionDescriber: PrecisionDescriber ->
        swiper = _swiper
        startCoordinatesProvider = _startCoordinatesProvider
        endCoordinatesProvider = _endCoordinatesProvider
        precisionDescriber = _precisionDescriber
        action = mock()
        action
    }

    @Before
    fun setup() {
        swipeResult = swipeHelper.swipeInDirection(
                args.direction,
                args.fast,
                args.normalizedSwipeAmount,
                args.normalizedStartingPointX,
                args.normalizedStartingPointY
        )
    }

    @Test
    fun shouldReturnAction() {
        assertEquals(action, swipeResult)
    }

    @Test
    fun shouldUseFingerPrecision() {
        assertEquals(Press.FINGER, precisionDescriber)
    }

    @Test
    fun shouldCalculateCorrectStartPoint() {
        val mockView = setupMockView()
        val startXY = startCoordinatesProvider.calculateCoordinates(mockView)
        val expectedStart = Pair(expected.startX, expected.startY)
        val actualStart = Pair(startXY[0], startXY[1])
        assertEquals(expectedStart, actualStart)
    }

    @Test
    fun shouldCalculateCorrectEndPoint() {
        val mockView = setupMockView()
        val endXY = endCoordinatesProvider.calculateCoordinates(mockView)
        val expectedEnd = Pair(expected.endX, expected.endY)
        val actualEnd = Pair(endXY[0], endXY[1])
        assertEquals(expectedEnd, actualEnd)
    }

    companion object {
        @JvmStatic
        @Parameterized.Parameters(name = "{0}")
        fun data(): Collection<Array<Any>> {
            return listOf(
                    arrayOf(
                            SwipeArguments(MOTION_DIR_LEFT, true, Double.NaN, Double.NaN, Double.NaN),
                            SwipeCoordinates(view.safeRight, view.middle, view.safeRight - 0.75f * screen.width, view.middle)
                    ),
                    arrayOf(
                            SwipeArguments(MOTION_DIR_LEFT, true, 1.0, Double.NaN, Double.NaN),
                            SwipeCoordinates(view.safeRight, view.middle, screen.left, view.middle)
                    ),
                    arrayOf(
                            SwipeArguments(MOTION_DIR_LEFT, false, Double.NaN, 1.0, 1.0),
                            SwipeCoordinates(view.safeRight, view.safeBottom, view.safeRight - 0.75f * screen.width, view.safeBottom)
                    ),
                    arrayOf(
                            SwipeArguments(MOTION_DIR_LEFT, false, 0.0, 0.5, 0.5),
                            SwipeCoordinates(view.center, view.middle, view.center, view.middle)
                    ),

                    arrayOf(
                            SwipeArguments(MOTION_DIR_RIGHT, true, Double.NaN, Double.NaN, Double.NaN),
                            SwipeCoordinates(view.safeLeft, view.middle, view.safeLeft + 0.75f * screen.width, view.middle)
                    ),
                    arrayOf(
                            SwipeArguments(MOTION_DIR_RIGHT, true, 1.0, Double.NaN, Double.NaN),
                            SwipeCoordinates(view.safeLeft, view.middle, screen.right, view.middle)
                    ),
                    arrayOf(
                            SwipeArguments(MOTION_DIR_RIGHT, false, Double.NaN, 0.0, 0.0),
                            SwipeCoordinates(view.safeLeft, view.safeTop, view.safeLeft + 0.75f * screen.width, view.safeTop)
                    ),
                    arrayOf(
                            SwipeArguments(MOTION_DIR_RIGHT, false, 0.0, 0.5, 0.5),
                            SwipeCoordinates(view.center, view.middle, view.center, view.middle)
                    ),

                    arrayOf(
                            SwipeArguments(MOTION_DIR_UP, true, Double.NaN, Double.NaN, Double.NaN),
                            SwipeCoordinates(view.center, view.safeBottom, view.center, view.safeBottom - 0.75f * screen.height)
                    ),
                    arrayOf(
                            SwipeArguments(MOTION_DIR_UP, true, 1.0, Double.NaN, Double.NaN),
                            SwipeCoordinates(view.center, view.safeBottom, view.center, screen.top)
                    ),
                    arrayOf(
                            SwipeArguments(MOTION_DIR_UP, false, Double.NaN, 1.0, 1.0),
                            SwipeCoordinates(view.safeRight, view.safeBottom, view.safeRight, view.safeBottom - 0.75f * screen.height)
                    ),
                    arrayOf(
                            SwipeArguments(MOTION_DIR_UP, false, 0.0, 0.5, 0.5),
                            SwipeCoordinates(view.center, view.middle, view.center, view.middle)
                    ),

                    arrayOf(
                            SwipeArguments(MOTION_DIR_DOWN, true, Double.NaN, Double.NaN, Double.NaN),
                            SwipeCoordinates(view.center, view.safeTop, view.center, view.safeTop + 0.75f * screen.height)
                    ),
                    arrayOf(
                            SwipeArguments(MOTION_DIR_DOWN, true, 1.0, Double.NaN, Double.NaN),
                            SwipeCoordinates(view.center, view.safeTop, view.center, screen.bottom)
                    ),
                    arrayOf(
                            SwipeArguments(MOTION_DIR_DOWN, false, Double.NaN, 0.0, 0.0),
                            SwipeCoordinates(view.safeLeft, view.safeTop, view.safeLeft, view.safeTop + 0.75f * screen.height)
                    ),
                    arrayOf(
                            SwipeArguments(MOTION_DIR_DOWN, false, 0.0, 0.5, 0.5),
                            SwipeCoordinates(view.center, view.middle, view.center, view.middle)
                    )
            )
        }

        val view = RectangleCalculator(200, 250, 3600, 4500, SwipeHelper.edgeFuzzFactor)
        val screen = RectangleCalculator(0, 0, 4000, 5000, 0f)
    }

    private fun setupMockView(): View {
        val mockView = mock<View>()
        val mockDisplayMetrics = mock<DisplayMetrics>()
        mockDisplayMetrics.widthPixels = screen.width
        mockDisplayMetrics.heightPixels = screen.height

        val mockResources = mock<Resources>()
        whenever(mockResources.displayMetrics).then { mockDisplayMetrics }

        val mockContext = mock<Context>()
        whenever(mockContext.resources).then { mockResources }
        whenever(mockView.context).then { mockContext }
        whenever(mockView.width).then { view.width }
        whenever(mockView.height).then { view.height }
        whenever(mockView.getLocationOnScreen(IntArray(2))).then {
            val arg0 = it.arguments[0]
            val xy = arg0 as IntArray
            xy[0] = view.x
            xy[1] = view.y
            xy
        }

        return mockView
    }
}
