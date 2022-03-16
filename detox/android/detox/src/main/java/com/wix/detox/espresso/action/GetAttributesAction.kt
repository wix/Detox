package com.wix.detox.espresso.action

import android.graphics.Rect
import android.os.Build
import android.view.View
import android.widget.CheckBox
import android.widget.ProgressBar
import android.widget.TextView
import androidx.test.espresso.UiController
import com.google.android.material.slider.Slider
import com.wix.detox.espresso.ViewActionWithResult
import org.hamcrest.Matcher
import org.hamcrest.Matchers
import org.hamcrest.Matchers.allOf
import org.hamcrest.Matchers.notNullValue
import org.json.JSONObject

class GetAttributesAction() : ViewActionWithResult<String?> {
    private val commonAttributes = CommonAttributes()
    private val textViewAttributes = TextViewAttributes()
    private val checkBoxAttributes = CheckBoxAttributes()
    private val progressBarAttributes = ProgressBarAttributes()
    private val sliderAttributes = SliderAttributes()
    private var result: String = ""

    override fun perform(uiController: UiController?, view: View?) {
        view!!

        val json = JSONObject()

        commonAttributes.get(json, view)
        textViewAttributes.get(json, view)
        checkBoxAttributes.get(json, view)
        progressBarAttributes.get(json, view)
        sliderAttributes.get(json, view)

        result = json.toString()
    }

    override fun getResult() = result
    override fun getDescription() = "Get view attributes"
    override fun getConstraints(): Matcher<View> = allOf(notNullValue(), Matchers.isA(View::class.java))
}

private class CommonAttributes {
    fun get(json: JSONObject, view: View) {
        getId(json, view)
        getVisibility(json, view)
        getContentDescription(json, view)
        getAlpha(json, view)
        getElevation(json, view)
        getHeight(json, view)
        getWidth(json, view)
        getHasFocus(json, view)
        getIsEnabled(json, view)
    }

    private fun getId(json: JSONObject, view: View) =
            view.tag?.let {
                json.put("identifier", it.toString())
            }

    private fun getVisibility(json: JSONObject, view: View) {
        json.put("visibility", visibilityMap[view.visibility])
        json.put("visible", view.getLocalVisibleRect(Rect()))
    }

    private fun getContentDescription(json: JSONObject, view: View) =
            view.contentDescription?.let {
                json.put("label", it)
            }

    private fun getElevation(json: JSONObject, view: View) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            json.put("elevation", view.elevation)
        }
    }

    private fun getAlpha(json: JSONObject, view: View) = json.put("alpha", view.alpha)
    private fun getHeight(json: JSONObject, view: View) = json.put("height", view.height)
    private fun getWidth(json: JSONObject, view: View) = json.put("width", view.width)
    private fun getIsEnabled(json: JSONObject, view: View) = json.put("enabled", view.isEnabled)
    private fun getHasFocus(json: JSONObject, view: View) = json.put("focused", view.isFocused)

    companion object {
        private val visibilityMap = mapOf(View.VISIBLE to "visible", View.INVISIBLE to "invisible", View.GONE to "gone")
    }
}

private class TextViewAttributes {
    fun get(json: JSONObject, view: View) {
        if (view is TextView) {
            getText(json, view)
            getLength(json, view)
            getTextSize(json, view)
            getHint(json, view)
        }
    }

    private fun getText(rootObject: JSONObject, view: TextView) =
            view.text?.let {
                rootObject.put("text", it.toString())
            }

    private fun getTextSize(rootObject: JSONObject, view: TextView) =
            rootObject.put("textSize", view.textSize)

    private fun getLength(rootObject: JSONObject, view: TextView) =
            view.text?.let {
                rootObject.put("length", view.length())
            }

    private fun getHint(rootObject: JSONObject, view: TextView) =
            view.hint?.let {
                rootObject.put("placeholder", it.toString())
            }
}

private class CheckBoxAttributes {
    fun get(json: JSONObject, view: View) {
        if (view is CheckBox) {
            getCheckboxValue(json, view)
        }
    }

    private fun getCheckboxValue(rootObject: JSONObject, view: CheckBox) =
            rootObject.put("value", view.isChecked)
}

private class ProgressBarAttributes {
    fun get(json: JSONObject, view: View) {
        if (view is ProgressBar) {
            getProgressBarValue(json, view)
        }
    }

    private fun getProgressBarValue(rootObject: JSONObject, view: ProgressBar) =
            rootObject.put("value", view.progress)
}

private class SliderAttributes {
    fun get(json: JSONObject, view: View) {
        if (view is Slider) {
            getSliderValue(json, view)
        }
    }

    private fun getSliderValue(rootObject: JSONObject, view: Slider) =
        rootObject.put("value", view.value)
}
