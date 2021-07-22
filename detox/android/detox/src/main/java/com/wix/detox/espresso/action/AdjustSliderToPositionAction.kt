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

class AdjustSliderToPositionAction(private val desiredPosition: Double, private val mManager: ReactSliderManager) : ViewAction {
    override fun getConstraints(): Matcher<View?>? = Matchers.allOf(
            ViewMatchers.isAssignableFrom(ReactSlider::class.java),
            getIsDisplayed())

    override fun getDescription() = "adjustSliderToPosition"

    fun getIsDisplayed(): Matcher<View?> = ViewMatchers.isDisplayed()

    private fun buildStyles(vararg keysAndValues: Any) = ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues))

    private fun calculateProgressTarget(view: ReactSlider): Double {
        val sliderProgress = view.toRealProgress(view.progress)
        val sliderScrollFactor = view.max / view.progress.toDouble()
        val sliderMaxValue = sliderProgress * sliderScrollFactor
        return desiredPosition * sliderMaxValue
    }

    override fun perform(uiController: UiController?, view: View) {
        val progressNewValue = calculateProgressTarget(view as ReactSlider)
        mManager.updateProperties(view, buildStyles("value", progressNewValue))
    }
}
