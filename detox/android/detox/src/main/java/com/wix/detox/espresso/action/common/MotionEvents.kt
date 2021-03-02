package com.wix.detox.espresso.action.common

import android.os.SystemClock
import android.view.InputDevice
import android.view.MotionEvent
import androidx.test.espresso.UiController
import androidx.test.espresso.action.MotionEvents

private val PRECISION = floatArrayOf(16f, 16f)

class MotionEvents {
    fun obtainMoveEvent(downEvent: MotionEvent, eventTime: Long, x: Float, y: Float): MotionEvent
            = MotionEvents.obtainMovement(downEvent.downTime, eventTime, floatArrayOf(x, y))!!

    fun obtainDownEvent(x: Float, y: Float, precision: FloatArray = PRECISION)
        = obtainDownEvent(x, y, precision, null)

    fun obtainDownEvent(x: Float, y: Float, precision: FloatArray = PRECISION, _downTime: Long?): MotionEvent {
        val pointerProperties = MotionEvent.PointerProperties().apply {
            id = 0
            toolType = MotionEvent.TOOL_TYPE_UNKNOWN
        }
        val pointerCoords = MotionEvent.PointerCoords().apply {
            clear()
            this.x = x
            this.y = y
            this.pressure = 0f
            this.size = 1f
        }
        val downTime = _downTime ?: SystemClock.uptimeMillis()

        return MotionEvent.obtain(
                downTime,
                downTime,
                MotionEvent.ACTION_DOWN,
                1,
                arrayOf(pointerProperties),
                arrayOf(pointerCoords),
                0,
                MotionEvent.BUTTON_PRIMARY,
                precision[0],
                precision[1],
                0,
                0,
                InputDevice.SOURCE_UNKNOWN,
                0)
    }

    fun obtainUpEvent(downEvent: MotionEvent, eventTime: Long, x: Float, y: Float): MotionEvent
            = MotionEvent.obtain(downEvent.downTime, eventTime, MotionEvent.ACTION_UP, x, y, 0)!!

    fun sendDownAsync(uiController: UiController, x: Float, y: Float, precision: FloatArray = PRECISION): MotionEvent {
        val downEvent = obtainDownEvent(x, y, precision, null)
        uiController.injectMotionEvent(downEvent)
        return downEvent
    }

    fun sendDownSync(uiController: UiController, x: Float, y: Float, precision: FloatArray = PRECISION)
            = MotionEvents.sendDown(uiController, floatArrayOf(x, y), precision)

    fun sendMovementAsync(uiController: UiController, downEvent: MotionEvent, eventTime: Long, x: Float, y: Float): Boolean {
        val event = obtainMoveEvent(downEvent, eventTime, x, y)
        return uiController.injectMotionEvent(event)
    }

    fun sendMovementSync(uiController: UiController, downEvent: MotionEvent, x: Float, y: Float)
            = MotionEvents.sendMovement(uiController, downEvent, floatArrayOf(x, y))

    fun sendUp(uiController: UiController, downEvent: MotionEvent, x: Float, y: Float)
            = MotionEvents.sendUp(uiController, downEvent, floatArrayOf(x, y))

    fun sendCancel(uiController: UiController, downEvent: MotionEvent)
            = MotionEvents.sendCancel(uiController, downEvent)
}
