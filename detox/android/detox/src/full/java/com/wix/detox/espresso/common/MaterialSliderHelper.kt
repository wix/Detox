package com.wix.detox.espresso.common

import android.view.View
import com.wix.detox.espresso.action.common.ReflectUtils
import org.joor.Reflect

private const val CLASS_MATERIAL_SLIDER = "com.google.android.material.slider.Slider"

open class MaterialSliderHelper(protected val view: View) {
    fun getValueIfSlider(): Float? {
        if (!isSlider()) {
            return null
        }

        return getValue()
    }

    private fun isSlider() = ReflectUtils.isAssignableFrom(view, CLASS_MATERIAL_SLIDER)

    private fun getValue() = Reflect.on(view).call("getValue").get() as Float
}
