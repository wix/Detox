package com.wix.detox.espresso.action

import android.graphics.Rect
import android.os.Build
import android.view.View
import android.widget.CheckBox
import android.widget.ProgressBar
import android.widget.TextView
import androidx.test.espresso.UiController
import com.wix.detox.espresso.ViewActionWithResult
import com.wix.detox.espresso.MultipleViewsAction
import com.wix.detox.espresso.common.ReactSliderHelper
import com.wix.detox.espresso.common.MaterialSliderHelper
import com.wix.detox.reactnative.ui.getAccessibilityLabel
import org.hamcrest.Matcher
import org.hamcrest.Matchers
import org.hamcrest.Matchers.allOf
import org.hamcrest.Matchers.notNullValue
import org.json.JSONObject

private interface AttributeExtractor {
    fun extractAttributes(json: JSONObject, view: View)
}

class GetAttributesAction() : ViewActionWithResult<JSONObject?>, MultipleViewsAction {
    private val attributeExtractors = listOf(
        CommonAttributes(),
        TextViewAttributes(),
        CheckBoxAttributes(),
        ProgressBarAttributes(),
        MaterialSliderAttributes()
    )
    private var result: JSONObject? = null

    override fun perform(uiController: UiController?, view: View?) {
        view!!

        val json = JSONObject()
        attributeExtractors.forEach { it.extractAttributes(json, view) }

        result = json
    }

    override fun getResult() = result
    override fun getDescription() = "Get view attributes"
    override fun getConstraints(): Matcher<View> = allOf(notNullValue(), Matchers.isA(View::class.java))
}

private class CommonAttributes : AttributeExtractor {
    override fun extractAttributes(json: JSONObject, view: View) {
        getId(json, view)
        getVisibility(json, view)
        getAccessibilityLabel(json, view)
        getAlpha(json, view)
        getElevation(json, view)
        getFrame(json, view)
        getHeight(json, view)
        getWidth(json, view)
        getHasFocus(json, view)
        getIsEnabled(json, view)
    }

    private fun getId(json: JSONObject, view: View) =
            view.tag?.let {
                json.put("identifier", it.toString())
            }

    private fun getFrame(json: JSONObject, view: View) {
        val location = IntArray(2)
        view.getLocationOnScreen(location)
        json.put("frame", JSONObject().apply {
            put("x", location[0])
            put("y", location[1])
            put("width", view.width)
            put("height", view.height)
        })
    }

    private fun getVisibility(json: JSONObject, view: View) {
        json.put("visibility", visibilityMap[view.visibility])
        json.put("visible", view.getLocalVisibleRect(Rect()))
    }

    private fun getAccessibilityLabel(json: JSONObject, view: View) =
            view.getAccessibilityLabel()?.let {
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

private class TextViewAttributes : AttributeExtractor {
    override fun extractAttributes(json: JSONObject, view: View) {
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

private class CheckBoxAttributes : AttributeExtractor {
    override fun extractAttributes(json: JSONObject, view: View) {
        if (view is CheckBox) {
            getCheckboxValue(json, view)
        }
    }

    private fun getCheckboxValue(rootObject: JSONObject, view: CheckBox) =
            rootObject.put("value", view.isChecked)
}

/**
 * Note: this applies also to [androidx.appcompat.widget.AppCompatSeekBar], which
 * is anything RN-slider-ish.
 */
private class ProgressBarAttributes : AttributeExtractor {
    override fun extractAttributes(json: JSONObject, view: View) {
        if (view is ProgressBar) {
            ReactSliderHelper.maybeCreate(view)?.let {
                getReactSliderValue(json, it)
            } ?:
                getProgressBarValue(json, view)
        }
    }

    private fun getReactSliderValue(rootObject: JSONObject, reactSliderHelper: ReactSliderHelper) {
        rootObject.put("value", reactSliderHelper.getCurrentProgressPct())
    }

    private fun getProgressBarValue(rootObject: JSONObject, view: ProgressBar) =
            rootObject.put("value", view.progress)
}

private class MaterialSliderAttributes : AttributeExtractor {
    override fun extractAttributes(json: JSONObject, view: View) {
        MaterialSliderHelper(view).getValueIfSlider()?.let {
            json.put("value", it)
        }
    }
}
