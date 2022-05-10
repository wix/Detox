package com.wix.detox.espresso.common

import android.view.View
import androidx.appcompat.widget.AppCompatSeekBar
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.views.slider.ReactSlider
import com.wix.detox.common.DetoxErrors.DetoxIllegalStateException
import com.wix.detox.espresso.action.common.ReflectUtils
import org.joor.Reflect

private const val CLASS_REACT_SLIDER_LEGACY = "com.facebook.react.views.slider.ReactSlider"
private const val CLASS_REACT_SLIDER_COMMUNITY = "com.reactnativecommunity.slider.ReactSlider"

abstract class SliderHelper(protected val slider: AppCompatSeekBar) {
    fun calcProgressTargetValue(desiredPosition: Double): Double {
        val sliderMaxProgress = calcMaxProgress()
        return desiredPosition * sliderMaxProgress
    }

    fun calcMaxProgress(): Double {
        val rawProgress = slider.progress
        val sliderProgress = Reflect.on(slider).call("toRealProgress", rawProgress).get() as Double
        val sliderScrollFactor = slider.max / rawProgress.toDouble()
        return sliderProgress * sliderScrollFactor
    }

    abstract fun setProgressValue(value: Double)

    companion object {
        fun createHelper(view: View) =
            when {
                ReflectUtils.isAssignableFrom(view, CLASS_REACT_SLIDER_LEGACY)
                    -> LegacySliderHelper(view as ReactSlider)
                ReflectUtils.isAssignableFrom(view, CLASS_REACT_SLIDER_COMMUNITY)
                    -> CommunitySliderHelper(view as AppCompatSeekBar)
                else
                    -> throw DetoxIllegalStateException("Cannot handle this type of a seek-bar view (Class ${view.javaClass.canonicalName}). " +
                        "Only React Native sliders are currently supported.")
            }
    }
}

private class LegacySliderHelper(slider: AppCompatSeekBar): SliderHelper(slider) {
    override fun setProgressValue(value: Double) {
        val reactSliderManager = com.facebook.react.views.slider.ReactSliderManager()
        reactSliderManager.updateProperties(slider as ReactSlider, buildStyles("value", value))
    }

    private fun buildStyles(vararg keysAndValues: Any) = ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues))
}

private class CommunitySliderHelper(slider: AppCompatSeekBar): SliderHelper(slider) {
    override fun setProgressValue(value: Double) {
        val reactSliderManager = Class.forName("com.reactnativecommunity.slider.ReactSliderManager").newInstance()
        Reflect.on(reactSliderManager).call("setValue", slider, value)
    }
}
