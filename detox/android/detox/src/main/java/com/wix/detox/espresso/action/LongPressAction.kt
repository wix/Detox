package com.wix.detox.espresso.action

import android.os.SystemClock
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.PerformException
import androidx.test.espresso.util.HumanReadables
import org.hamcrest.Matcher
import androidx.test.espresso.matcher.ViewMatchers.isDisplayingAtLeast
import java.util.Locale

/**
 * A ViewAction that performs a long press on a view.
 *
 * This is a modified version of the GeneralClickAction from the Espresso source code.
 * @see https://github.com/android/android-test/blob/ae4c0b912f59db61233ef9e5fb35db817037589d/espresso/core/java/androidx/test/espresso/action/GeneralClickAction.java
 *
 * @param duration The duration of the long press in milliseconds. Default is the long press timeout.
 * @param x The x-coordinate of the long press relative to the view. Default is the center of the view.
 * @param y The y-coordinate of the long press relative to the view. Default is the center of the view.
 */
class LongPressAction(
    private val duration: Int = ViewConfiguration.getLongPressTimeout(),
    private val x: Int? = null,
    private val y: Int? = null
) : ViewAction {

    override fun getConstraints(): Matcher<View> = isDisplayingAtLeast(90)

    override fun getDescription(): String =
        String.format("long press for %d milliseconds, at coordinates (%s, %s).", duration, x, y)

    override fun perform(uiController: UiController, view: View) {
        val finalX = if (x != null) x.toFloat() else (view.width / 2f + view.left)
        val finalY = if (y != null) y.toFloat() else (view.height / 2f + view.top)

        uiController.loopMainThreadUntilIdle()
        val startTime = SystemClock.uptimeMillis()
        try {
            uiController.injectMotionEvent(
                MotionEvent.obtain(
                    startTime, startTime,
                    MotionEvent.ACTION_DOWN, finalX, finalY, 0
                )
            )

            // Wait for the specified duration to mimic a long press, at least until the press state timeout
            val finalDuration = minOf(duration, ViewConfiguration.getPressedStateDuration()).toLong()
            uiController.loopMainThreadForAtLeast(finalDuration)

            uiController.injectMotionEvent(
                MotionEvent.obtain(
                    startTime, SystemClock.uptimeMillis(),
                    MotionEvent.ACTION_UP, finalX, finalY, 0
                )
            )
        } catch (e: Exception) {
            throw PerformException.Builder()
                .withActionDescription(getDescription())
                .withViewDescription(HumanReadables.describe(view))
                .withCause(e)
                .build()
        } finally {
            uiController.loopMainThreadUntilIdle()
        }
    }
}
