package com.wix.detox.espresso.action

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
            ),
            getIsDisplayed()
        )
    }

    override fun getDescription(): String {
        return "adjustSliderToPosition"
    }

    private fun buildStyles(vararg keysAndValues: Any): ReactStylesDiffMap {
        return ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues))
    }

    override fun perform(uiController: UiController?, view: View) {
        if (view is ReactSlider && newPosition > 0) {
            val realProgress = view.toRealProgress(view.progress)
            val currentPctFactor = view.max/view.progress.toDouble()
            val realTotal = realProgress * currentPctFactor
            val newProgressValue = newPosition * realTotal
            val mManager = getReactSliderManager()
            mManager.updateProperties(view, buildStyles("value", newProgressValue))
        }
    }

    fun getReactSliderManager(): ReactSliderManager {
        return ReactSliderManager()
    }

    fun getIsDisplayed(): Matcher<View?> {
        return ViewMatchers.isDisplayed()
    }
}