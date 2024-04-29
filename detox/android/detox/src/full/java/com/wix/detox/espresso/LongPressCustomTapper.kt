package com.wix.detox.espresso;

import android.view.ViewConfiguration
import androidx.test.espresso.UiController
import androidx.test.espresso.action.MotionEvents
import androidx.test.espresso.action.Tapper

import android.view.MotionEvent

/* This class is a copy of the DetoxSingleTap class from the Detox library, but with the sendTap method removed. */
private class LongPressCustomTapper(private val longPressTimeout: Long) : Tapper {
    override fun sendTap(
        uiController: UiController,
        coordinates: FloatArray,
        precision: FloatArray,
        inputDevice: Int,
        buttonState: Int
    ): Tapper.Status {
        val downEvent = MotionEvents.sendDown(uiController, coordinates, precision, inputDevice, buttonState).down

        try {
            val systemLongPressTimeout = ViewConfiguration.getLongPressTimeout().toLong()
            val minimumTimeout = minOf(longPressTimeout, systemLongPressTimeout)

            uiController.loopMainThreadForAtLeast(minimumTimeout)

            if (!MotionEvents.sendUp(uiController, downEvent, coordinates)) {
                MotionEvents.sendCancel(uiController, downEvent)

                return Tapper.Status.FAILURE
            }
        } finally {
            downEvent.recycle()
        }

        return Tapper.Status.SUCCESS
    }

    @Deprecated("Use sendTap with inputDevice and buttonState instead.")
    override fun sendTap(
        uiController: UiController,
        coordinates: FloatArray,
        precision: FloatArray
    ): Tapper.Status {
        return sendTap(uiController, coordinates, precision, MotionEvent.TOOL_TYPE_FINGER, MotionEvent.BUTTON_PRIMARY)
    }
}
