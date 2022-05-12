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
    fun getCurrentProgressPct(): Double {
        val nativeProgress = slider.progress.toDouble()
        val nativeMax = slider.max
        return nativeProgress / nativeMax
    }

    // TODO Make this more testable (e.g. by delegating the set action away)
    fun setProgressPct(valuePct: Double) {
        val maxJSProgress = calcMaxJSProgress()
        val valueJS = valuePct * maxJSProgress
        setProgressJS(valueJS)
    }

    protected abstract fun setProgressJS(valueJS: Double)

    private fun calcMaxJSProgress(): Double {
        val nativeProgress = slider.progress.toDouble()
        val nativeMax = slider.max
        val toMaxFactor = nativeMax / nativeProgress

        val jsProgress = getJSProgress()
        return jsProgress * toMaxFactor
    }

    private fun getJSProgress(): Double =
        Reflect.on(slider).call("toRealProgress", slider.progress).get() as Double

    companion object {
        fun create(view: View) =
            maybeCreate(view)
                ?: throw DetoxIllegalStateException("Cannot handle this type of a seek-bar view (Class ${view.javaClass.canonicalName}). " +
                        "Only React Native sliders are currently supported.")

        fun maybeCreate(view: View): SliderHelper? =
            when {
                ReflectUtils.isAssignableFrom(view, CLASS_REACT_SLIDER_LEGACY)
                   -> LegacySliderHelper(view as ReactSlider)
                ReflectUtils.isAssignableFrom(view, CLASS_REACT_SLIDER_COMMUNITY)
                    -> CommunitySliderHelper(view as AppCompatSeekBar)
                else
                   -> null
            }
    }
}

private class LegacySliderHelper(slider: AppCompatSeekBar): SliderHelper(slider) {
    override fun setProgressJS(valueJS: Double) {
        val reactSliderManager = com.facebook.react.views.slider.ReactSliderManager()
        reactSliderManager.updateProperties(slider as ReactSlider, buildStyles("value", valueJS))
    }

    private fun buildStyles(vararg keysAndValues: Any) = ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues))
}

private class CommunitySliderHelper(slider: AppCompatSeekBar): SliderHelper(slider) {
    override fun setProgressJS(valueJS: Double) {
        val reactSliderManager = Class.forName("com.reactnativecommunity.slider.ReactSliderManager").newInstance()
        Reflect.on(reactSliderManager).call("setValue", slider, valueJS)
    }
}
