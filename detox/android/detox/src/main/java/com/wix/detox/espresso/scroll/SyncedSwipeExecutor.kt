package com.wix.detox.espresso.scroll

import android.os.SystemClock
import android.util.Log
import android.view.MotionEvent
import android.view.ViewConfiguration
import androidx.test.espresso.UiController
import androidx.test.espresso.action.MotionEvents

private const val LOG_TAG = "DetoxSyncedSwipeExec"
private val PRECISION = floatArrayOf(1f, 1f)

/**
 * Sync'ed implementation of a [SwipeExecutor] - i.e. makes sure each step is
 * backed by proper delays when finished.
 *
 * @see DetoxSwiper
 */
class SyncedSwipeExecutor(
        private val uiController: UiController,
        private val perMotionTimeMS: Long)
    : SwipeExecutor {

    lateinit var downEvent: MotionEvent

    private var targetTime: Long = -1L

    override fun startAt(touchX: Float, touchY: Float) {
        downEvent = MotionEvents.sendDown(uiController, floatArrayOf(touchX, touchY), PRECISION).down
        targetTime = downEvent.downTime
    }

    override fun moveTo(targetX: Float, targetY: Float): Boolean {
        if (!MotionEvents.sendMovement(uiController, downEvent, floatArrayOf(targetX, targetY))) {
            Log.e(LOG_TAG, "Injection of move event as part of the scroll failed. Sending cancel event.")
            MotionEvents.sendCancel(uiController, downEvent)
            return false
        }

        syncMovement()
        return true
    }

    override fun finishAt(releaseX: Float, releaseY: Float) {
        try {
            if (!MotionEvents.sendUp(uiController, downEvent, floatArrayOf(releaseX, releaseY))) {
                Log.e(LOG_TAG, "Injection of up event as part of the scroll failed. Sending cancel event.")
                MotionEvents.sendCancel(uiController, downEvent)
            }
        } finally {
            downEvent.recycle()
        }

        syncRelease()
    }

    private fun syncMovement() {
        val timeLeft = targetTime - SystemClock.uptimeMillis()
        if (timeLeft > 10) {
            uiController.loopMainThreadForAtLeast(timeLeft)
        }

        targetTime += perMotionTimeMS
    }

    private fun syncRelease() {
        // Ensures that all child views leave the pressed-on state, if in effect.
        // This is paramount for having consequent tap-events registered properly.
        val androidPressedDuration = ViewConfiguration.getPressedStateDuration()
        if (androidPressedDuration > 0) {
            uiController.loopMainThreadForAtLeast(androidPressedDuration.toLong())
        }
    }
}
