package com.wix.detox.espresso.scroll

import android.graphics.Insets
import android.view.MotionEvent
import android.view.View
import android.view.WindowInsets
import androidx.test.espresso.UiController
import androidx.test.platform.app.InstrumentationRegistry
import com.wix.detox.action.common.MOTION_DIR_DOWN
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

@Config(qualifiers = "xxxhdpi", sdk = [33])
@RunWith(RobolectricTestRunner::class)
class ScrollHelperTest {

    private val display = DeviceDisplay.getScreenSizeInPX()
    private val displayWidth = display[0].toInt()
    private val displayHeight = display[1].toInt()

    private val uiController = mock<UiController>()
    private val view = mockView(displayWidth, displayHeight)

    @Test
    fun `perform scroll down for 200 dp on full screen view`() {
        val amountInDp = 200.0
        val amountInPx = amountInDp * DeviceDisplay.getDensity()
        val touchSlopPx = ScrollHelper.getViewConfiguration().scaledTouchSlop

        ScrollHelper.perform(uiController, view, MOTION_DIR_DOWN, amountInDp, null, null)
        val capture = argumentCaptor<Iterable<MotionEvent>>()
        verify(uiController).injectMotionEventSequence(capture.capture())

        val listOfCapturedEvents = capture.firstValue.toList()
        val lastEvent = listOfCapturedEvents.last() // The last event is the UP event with the target coordinates
        // the joinery of the swipe is not interesting
        val lastEventX = lastEvent.x
        val lastEventY = lastEvent.y
        assertEquals(displayWidth / 2.0, lastEventX.toDouble(), 0.0)
        assertEquals(displayHeight - amountInPx - touchSlopPx - DeviceDisplay.convertDpiToPx(1.0), lastEventY.toDouble(), 0.0)
    }

    @Test
    fun `perform scroll down for 200 dp on full screen view with offset y`() {
        val amountInDp = 200.0
        val amountInPx = amountInDp * DeviceDisplay.getDensity()
        val touchSlopPx = ScrollHelper.getViewConfiguration().scaledTouchSlop
        val offsetPercent = 0.9f

        ScrollHelper.perform(uiController, view, MOTION_DIR_DOWN, amountInDp, null, offsetPercent)
        val capture = argumentCaptor<Iterable<MotionEvent>>()
        verify(uiController).injectMotionEventSequence(capture.capture())

        val listOfCapturedEvents = capture.firstValue.toList()
        val lastEvent = listOfCapturedEvents.last() // The last event is the UP event with the target coordinates
        // the joinery of the swipe is not interesting
        val lastEventX = lastEvent.x
        val lastEventY = lastEvent.y
        assertEquals(displayWidth / 2.0, lastEventX.toDouble(), 0.0)
        assertEquals(displayHeight - amountInPx - touchSlopPx  - DeviceDisplay.convertDpiToPx(1.0), lastEventY.toDouble(), 0.0)

    }

    private fun mockView(displayWidth: Int, displayHeight: Int): View {
        val windowInsets = mock<WindowInsets>() {
            whenever(it.systemGestureInsets).thenReturn(
                Insets.of(88, 88, 88, 100)
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
