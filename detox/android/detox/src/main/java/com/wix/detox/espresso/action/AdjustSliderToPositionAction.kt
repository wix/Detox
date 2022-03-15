package com.wix.detox.espresso.action

import android.view.View
import androidx.appcompat.widget.AppCompatSeekBar
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.matcher.ViewMatchers
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.views.slider.ReactSlider
import com.wix.detox.espresso.action.common.ReflectUtils
import org.hamcrest.Matcher
import org.hamcrest.Matchers

private const val CLASS_REACT_SLIDER_LEGACY = "com.facebook.react.views.slider.ReactSlider"
private const val CLASS_REACT_SLIDER_COMMUNITY = "com.reactnativecommunity.slider.ReactSlider"

class AdjustSliderToPositionAction(private val desiredPosition: Double) : ViewAction {

    override fun getConstraints(): Matcher<View?>? = Matchers.allOf(
        ViewMatchers.isAssignableFrom(AppCompatSeekBar::class.java),
        getIsDisplayed())

    override fun getDescription() = "adjustSliderToPosition"

    fun getIsDisplayed(): Matcher<View?> = ViewMatchers.isDisplayed()

    private fun buildStyles(vararg keysAndValues: Any) = ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues))

    private fun calculateProgressTarget(view: View): Double {
        val castView = view as AppCompatSeekBar
        val sliderProgress = when {
            (ReflectUtils.isObjectAssignableFrom(view, CLASS_REACT_SLIDER_LEGACY)) ->
                (view as ReactSlider).toRealProgress(view.progress)
            (ReflectUtils.isObjectAssignableFrom(view, CLASS_REACT_SLIDER_COMMUNITY)) ->
                (view as com.reactnativecommunity.slider.ReactSlider).toRealProgress(view.progress)
            else -> (view as ReactSlider).toRealProgress(view.progress)
        }
        val sliderScrollFactor = castView.max / view.progress.toDouble()
        val sliderMaxValue = sliderProgress * sliderScrollFactor
        return desiredPosition * sliderMaxValue
    }

    override fun perform(uiController: UiController?, view: View) {
        val progressNewValue = calculateProgressTarget(view)

        if (ReflectUtils.isObjectAssignableFrom(view, CLASS_REACT_SLIDER_LEGACY)) {
            val reactSliderManager = com.facebook.react.views.slider.ReactSliderManager()
            reactSliderManager.updateProperties(view as ReactSlider, buildStyles("value", progressNewValue))
        }
        else if (ReflectUtils.isObjectAssignableFrom(view, CLASS_REACT_SLIDER_COMMUNITY)) {
            val reactSliderManager = com.reactnativecommunity.slider.ReactSliderManager()
            reactSliderManager.setValue(view as com.reactnativecommunity.slider.ReactSlider, progressNewValue)
        }
    }
}
