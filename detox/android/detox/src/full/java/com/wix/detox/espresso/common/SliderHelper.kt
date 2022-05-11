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
    fun calcCurrentProgressPct(): Double {
        val jsProgress = getJSProgress()
        val maxJSProgress = calcMaxJSProgress()
        return jsProgress / maxJSProgress
    }

    fun calcMaxJSProgress(): Double {
        val nativeProgress = slider.progress.toDouble()
        val nativeMax = slider.max
        val toMaxFactor = nativeMax / nativeProgress

        val jsProgress = getJSProgress()
        return jsProgress * toMaxFactor
    }

    abstract fun setProgressValue(valueJS: Double)

    private fun getJSProgress(): Double =
        Reflect.on(slider).call("toRealProgress", slider.progress).get() as Double

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
    override fun setProgressValue(valueJS: Double) {
        val reactSliderManager = com.facebook.react.views.slider.ReactSliderManager()
        reactSliderManager.updateProperties(slider as ReactSlider, buildStyles("value", valueJS))
    }

    private fun buildStyles(vararg keysAndValues: Any) = ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues))
}

private class CommunitySliderHelper(slider: AppCompatSeekBar): SliderHelper(slider) {
    override fun setProgressValue(valueJS: Double) {
        val reactSliderManager = Class.forName("com.reactnativecommunity.slider.ReactSliderManager").newInstance()
        Reflect.on(reactSliderManager).call("setValue", slider, valueJS)
    }
}
