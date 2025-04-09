package com.wix.detox.espresso.scroll

import android.graphics.Insets
import android.view.MotionEvent
import android.view.View
import android.view.WindowInsets
import androidx.test.espresso.UiController
import androidx.test.platform.app.InstrumentationRegistry
import com.wix.detox.action.common.MOTION_DIR_DOWN
import com.wix.detox.action.common.MOTION_DIR_LEFT
import com.wix.detox.action.common.MOTION_DIR_RIGHT
import com.wix.detox.action.common.MOTION_DIR_UP
import com.wix.detox.espresso.DeviceDisplay
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import kotlin.test.assertEquals

private const val INSETS_SIZE = 100
private const val SCROLL_RANGE_SAFE_PERCENT = 0.9f // ScrollHelper.SCROLL_RANGE_SAFE_PERCENT

@Config(
    qualifiers = "xxxhdpi", // 1280x1880
)
@RunWith(RobolectricTestRunner::class)
class ScrollHelperTest {

    private val display = DeviceDisplay.getScreenSizeInPX()
    private val displayWidth = display[0].toInt()
    private val displayHeight = display[1].toInt()
    private val touchSlopPx = ScrollHelper.getViewConfiguration().scaledTouchSlop
    private val safetyMarginPx = DeviceDisplay.convertDpiToPx(2.0)

    private val uiControllerMock = mock<UiController>()
    private val viewMock = mockViewWithGestureNavigation(displayWidth, displayHeight)

    @Test
    fun `should scrolling down by 200 when gesture navigation enabled`() {
        val amountInDp = 200.0
        val amountInPx = amountInDp * DeviceDisplay.getDensity()

        ScrollHelper.perform(uiControllerMock, viewMock, MOTION_DIR_DOWN, amountInDp, null, null)

        val upEvent = getUpEvent()
        // Verify that the scroll started at the center of the view
        assertEquals(displayWidth / 2.0, upEvent.x.toDouble(), 0.0)
        // Verify that the scroll ended at the center of the view minus the requested amount
        assertEquals(displayHeight - amountInPx - touchSlopPx - safetyMarginPx - INSETS_SIZE, upEvent.y.toDouble(), 0.0)
    }

    @Test
    fun `should scrolling down by 200 when gesture navigation disabled`() {
        val amountInDp = 200.0
        val amountInPx = amountInDp * DeviceDisplay.getDensity()

        val viewMock = mockViewWithoutGestureNavigation(displayWidth, displayHeight)
        ScrollHelper.perform(uiControllerMock, viewMock, MOTION_DIR_DOWN, amountInDp, null, null)

        val upEvent = getUpEvent()
        // Verify that the scroll started at the center of the view
        assertEquals(displayWidth / 2.0, upEvent.x.toDouble(), 0.0)
        // Verify that the scroll ended at the center of the view minus the requested amount
        assertEquals(displayHeight - amountInPx - touchSlopPx - safetyMarginPx, upEvent.y.toDouble(), 0.0)
    }

    @Test
    fun `should scroll down to edge on full screen view when gesture navigation enabled`() {
        ScrollHelper.performOnce(uiControllerMock, viewMock, MOTION_DIR_DOWN, null, null)
        val upEvent = getUpEvent()
        val amountInPx = displayHeight * SCROLL_RANGE_SAFE_PERCENT

        // Calculate where the scroll should end
        val targetY = displayHeight - amountInPx -
            touchSlopPx -
            safetyMarginPx -
            INSETS_SIZE

        assertEquals(displayWidth / 2.0, upEvent.x.toDouble(), 0.0)
        assertEquals(targetY, upEvent.y, 0.0f)
    }

    @Test
    fun `should scroll left to edge on full screen view when gesture navigation enabled`() {
        ScrollHelper.performOnce(uiControllerMock, viewMock, MOTION_DIR_LEFT, null, null)
        val upEvent = getUpEvent()
        val amountInPx = displayWidth * SCROLL_RANGE_SAFE_PERCENT

        // Calculate where the scroll should end
        val targetX = amountInPx +
            touchSlopPx +
            safetyMarginPx +
            INSETS_SIZE

        assertEquals(targetX, upEvent.x, 0.0f)
        assertEquals(displayHeight / 2.0, upEvent.y.toDouble(), 0.0)
    }

    @Test
    fun `should scroll up to edge on full screen view when gesture navigation enabled`() {
        ScrollHelper.performOnce(uiControllerMock, viewMock, MOTION_DIR_UP,null, null)
        val upEvent = getUpEvent()
        val amountInPx = displayHeight * SCROLL_RANGE_SAFE_PERCENT

        // Calculate where the scroll should end
        val targetY = amountInPx +
            touchSlopPx +
            safetyMarginPx +
            INSETS_SIZE

        assertEquals(displayWidth / 2.0, upEvent.x.toDouble(), 0.0)
        assertEquals(targetY, upEvent.y, 0.0f)
    }

    @Test
    fun `should scroll right to edge on full screen view when gesture navigation enabled`() {
        ScrollHelper.performOnce(uiControllerMock, viewMock, MOTION_DIR_RIGHT,  null, null)
        val upEvent = getUpEvent()
        val amountInPx = displayWidth * SCROLL_RANGE_SAFE_PERCENT

        // Calculate where the scroll should end
        val targetX = displayWidth - amountInPx -
            touchSlopPx -
            safetyMarginPx -
            INSETS_SIZE

        assertEquals(targetX, upEvent.x, 0.0f)
        assertEquals(displayHeight / 2.0, upEvent.y.toDouble(), 0.0)
    }

    /**
     * Get the performed UP event from the ui controller
     */
    private fun getUpEvent(): MotionEvent {
        val capture = argumentCaptor<Iterable<MotionEvent>>()
        // Capture the events from the ui controller
        verify(uiControllerMock).injectMotionEventSequence(capture.capture())

        val listOfCapturedEvents = capture.firstValue.toList()
        // The last event is the UP event with the target coordinates. All of the rest are not interesting
        return listOfCapturedEvents.last()
    }

    private fun mockViewWithoutGestureNavigation(displayWidth: Int, displayHeight: Int): View {
        // This is how we disable gesture navigation
        val windowInsets = mock<WindowInsets>() {
            whenever(it.systemGestureInsets).thenReturn(
                Insets.of(0, 0, 0, 0)
            )
        }

        return mockView(displayWidth, displayHeight, windowInsets)
    }

    /**
     * Mock a view with gesture navigation enabled
     */
    private fun mockViewWithGestureNavigation(displayWidth: Int, displayHeight: Int): View {
        // This is how we enable gesture navigation
        val windowInsets = mock<WindowInsets>() {
            whenever(it.systemGestureInsets).thenReturn(
                Insets.of(INSETS_SIZE, INSETS_SIZE, INSETS_SIZE, INSETS_SIZE)
            )
        }

        return mockView(displayWidth, displayHeight, windowInsets)
    }

    private fun mockView(
        displayWidth: Int,
        displayHeight: Int,
        windowInsets: WindowInsets
    ): View {
        val view = mock<View>() {
            whenever(it.width).thenReturn(displayWidth)
            whenever(it.height).thenReturn(displayHeight)
            whenever(it.canScrollVertically(any())).thenReturn(true) // We allow endless scroll
            whenever(it.canScrollHorizontally(any())).thenReturn(true) // We allow endless scroll
            whenever(it.context).thenReturn(InstrumentationRegistry.getInstrumentation().targetContext)
            whenever(it.rootWindowInsets).thenReturn(windowInsets)
        }
        return view
    }
}
