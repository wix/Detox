package com.wix.detox.espresso.action

import android.os.Handler
import android.os.Looper
import android.view.View
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.matcher.ViewMatchers
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.views.slider.ReactSlider
import com.facebook.react.views.slider.ReactSliderManager
import org.hamcrest.Matcher
import org.hamcrest.Matchers

class AdjustSliderToPositionAction(private val newPosition: Double) : ViewAction {
    override fun getConstraints(): Matcher<View?>? {
        return Matchers.allOf(
            ViewMatchers.isAssignableFrom(
                ReactSlider::class.java
            ), ViewMatchers.isDisplayed()
        )
    }

    override fun getDescription(): String? {
        return "adjustSliderToPosition"
    }

    fun buildStyles(vararg keysAndValues: Any): ReactStylesDiffMap? {
        return ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues))
    }

    override fun perform(uiController: UiController?, view: View) {
        if (view is ReactSlider) {
            val mManager = ReactSliderManager()
            val realProgress = view.toRealProgress(view.progress)
            val currentPctFactor = view.max/view.progress.toDouble()
            val realTotal = realProgress * currentPctFactor
            val newProgressValue = newPosition * realTotal
            val newContentDescription = (newPosition * 100).toString() +"%"
            mManager.updateProperties(view, buildStyles("value", newProgressValue))

            val mHandler = Handler(Looper.getMainLooper())
            val runnable = {
                view.setContentDescription(newContentDescription)
            }

            mHandler.post (
                runnable
            )
        }
    }
}