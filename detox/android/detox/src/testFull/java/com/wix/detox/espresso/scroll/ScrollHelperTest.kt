package com.wix.detox.espresso.scroll

import android.graphics.Insets
import android.view.MotionEvent
import android.view.View
import android.view.WindowInsets
import androidx.test.espresso.UiController
import androidx.test.platform.app.InstrumentationRegistry
import com.wix.detox.action.common.MOTION_DIR_DOWN
import com.wix.detox.espresso.DeviceDisplay
import com.wix.detox.espresso.scroll.ScrollHelper.getViewSafeScrollableRangePix
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

@Config(qualifiers = "xxxhdpi", sdk = [33])
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
    fun `should take gesture navigation into account when scrolling down`() {
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
    fun `should scroll down to edge on full screen view when gesture navigation enabled`() {
        ScrollHelper.performOnce(uiControllerMock, viewMock, MOTION_DIR_DOWN)
        val upEvent = getUpEvent()
        val amountInPx = getViewSafeScrollableRangePix(viewMock, MOTION_DIR_DOWN).toFloat()

        assertEquals(displayWidth / 2.0, upEvent.x.toDouble(), 0.0)
        assertEquals(displayHeight - amountInPx - touchSlopPx - safetyMarginPx - INSETS_SIZE, upEvent.y, 0.0f)

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

        val view = mock<View>() {
            whenever(it.width).thenReturn(displayWidth)
            whenever(it.height).thenReturn(displayHeight)
            whenever(it.canScrollVertically(any())).thenReturn(true) // We allow endless scroll
            whenever(it.context).thenReturn(InstrumentationRegistry.getInstrumentation().targetContext)
            whenever(it.rootWindowInsets).thenReturn(windowInsets)
        }
        return view
    }
}
