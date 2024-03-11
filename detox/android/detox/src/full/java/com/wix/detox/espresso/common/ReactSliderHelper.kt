package com.wix.detox.espresso.common

import android.view.View
import androidx.appcompat.widget.AppCompatSeekBar
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.wix.detox.common.DetoxErrors.DetoxIllegalStateException
import com.wix.detox.espresso.action.common.ReflectUtils
import org.joor.Reflect

private const val CLASS_REACT_SLIDER_LEGACY = "com.facebook.react.views.slider.ReactSlider"
private const val CLASS_REACT_SLIDER_LEGACY_MANAGER = "com.facebook.react.views.slider.ReactSliderManager"
private const val CLASS_REACT_SLIDER_COMMUNITY = "com.reactnativecommunity.slider.ReactSlider"
private const val CLASS_REACT_SLIDER_COMMUNITY_MANAGER = "com.reactnativecommunity.slider.ReactSliderManager"

abstract class ReactSliderHelper(protected val slider: AppCompatSeekBar) {
    fun getCurrentProgressPct(): Double {
        val nativeProgress = slider.progress.toDouble()
        val nativeMax = slider.max
        return nativeProgress / nativeMax
    }

    // TODO Make this more testable (e.g. by delegating the set action away)
    fun setProgressPct(valuePct: Float) {
        val maxJSProgress = calcMaxJSProgress()
        val valueJS = valuePct * maxJSProgress
        setProgressJS(valueJS.toFloat())
    }

    protected abstract fun setProgressJS(valueJS: Float)

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

        fun maybeCreate(view: View): ReactSliderHelper? =
            when {
                ReflectUtils.isAssignableFrom(view, CLASS_REACT_SLIDER_LEGACY)
                   -> LegacySliderHelper(view as AppCompatSeekBar)
                ReflectUtils.isAssignableFrom(view, CLASS_REACT_SLIDER_COMMUNITY)
                    -> CommunitySliderHelper(view as AppCompatSeekBar)
                else
                   -> null
            }
    }
}

private class LegacySliderHelper(slider: AppCompatSeekBar): ReactSliderHelper(slider) {
    override fun setProgressJS(valueJS: Float) {
        val reactSliderManager = Class.forName(CLASS_REACT_SLIDER_LEGACY_MANAGER).newInstance()
        Reflect.on(reactSliderManager).call("updateProperties", slider, buildStyles("value", valueJS.toDouble()))
    }

    private fun buildStyles(vararg keysAndValues: Any) = ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues))
}

private class CommunitySliderHelper(slider: AppCompatSeekBar): ReactSliderHelper(slider) {
    override fun setProgressJS(valueJS: Float) {
        val reactSliderManager = Class.forName(CLASS_REACT_SLIDER_COMMUNITY_MANAGER).newInstance()
        Reflect.on(reactSliderManager).call("setValue", slider, valueJS)
    }
}
