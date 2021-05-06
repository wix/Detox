package com.wix.detox.espresso.action

import android.view.View
import android.widget.TextView
import android.widget.CheckBox
import androidx.test.espresso.UiController
import com.wix.detox.espresso.ViewActionWithResult
import org.hamcrest.Matcher
import org.hamcrest.Matchers
import org.json.JSONObject

open class GetAttributesAction()
    : ViewActionWithResult<String?> {

    private var result: String? = ""

    override fun perform(uiController: UiController?, view: View?) {
        val rootObject = JSONObject()

        if (view != null) {
            getViewAttributes(rootObject, view)
            getTextViewAttributes(rootObject, view)
            getCheckboxAttributes(rootObject, view)
        }

        result = rootObject.toString()
    }

    override fun getResult() = result
    override fun getDescription() = "Get attributes"
    override fun getConstraints(): Matcher<View> = Matchers.notNullValue(View::class.java)

    fun getViewAttributes(rootObject: JSONObject, view: View) {
        getId(rootObject, view)
        getVisibility(rootObject, view)
        getContentDescription(rootObject, view)
        getAlpha(rootObject, view)
        getElevation(rootObject, view)
        getHeight(rootObject, view)
        getWidth(rootObject, view)
        getHasFocus(rootObject, view)
        getIsEnabled(rootObject, view)
    }

    fun getTextViewAttributes(rootObject: JSONObject, view: View) {
        if (view is TextView) {
            getText(rootObject, view)
            getLength(rootObject, view)
            getTextSize(rootObject, view)
            getLineHeight(rootObject, view)
            getHint(rootObject, view)
        }
    }

    fun getCheckboxAttributes(rootObject: JSONObject, view: View) {
        if (view is CheckBox) {
            getCheckboxChecked(rootObject, view)
        }
    }

    // VIEW
    fun getId(rootObject: JSONObject, view: View) {
        val viewId = view.getId()
        if (viewId != View.NO_ID) rootObject.put("id", viewId)
    }

    fun getVisibility(rootObject: JSONObject, view: View) {
        val visibilityMap = mapOf(View.VISIBLE to "visible", View.INVISIBLE to "invisible", View.GONE to "gone")
        val visibility = visibilityMap.get(view.getVisibility())
        if (visibility != null) rootObject.put("visibility", visibility)
    }

    fun getContentDescription(rootObject: JSONObject, view: View) {
        val contentDescription = view.getContentDescription()
        if (contentDescription != null) rootObject.put("label", contentDescription)
    }

    fun getAlpha(rootObject: JSONObject, view: View) {
        val alpha = view.getAlpha()
        rootObject.put("alpha", alpha)
    }

    fun getElevation(rootObject: JSONObject, view: View) {
        val elevation = view.getElevation()
        rootObject.put("elevation", elevation)
    }

    fun getHeight(rootObject: JSONObject, view: View) {
        val height = view.getHeight()
        rootObject.put("height", height)
    }

    fun getWidth(rootObject: JSONObject, view: View) {
        val width = view.getWidth()
        rootObject.put("width", width)
    }

    fun getHasFocus(rootObject: JSONObject, view: View) {
        val hasFocus = view.hasWindowFocus()
        rootObject.put("hasFocus", hasFocus)
    }

    fun getIsEnabled(rootObject: JSONObject, view: View) {
        val isEnabled = view.isEnabled()
        rootObject.put("isEnabled", isEnabled)
    }

    // CHECKBOX
    fun getCheckboxChecked(rootObject: JSONObject, view: CheckBox) {
        val isChecked = view.isChecked()
        rootObject.put("isChecked", isChecked)
    }

    //TEXTVIEW
    fun getText(rootObject: JSONObject, view: TextView) {
        val textValue = view.getText()
        if (textValue != null) rootObject.put("text", textValue.toString())
    }

    fun getLength(rootObject: JSONObject, view: TextView) {
        val lengthValue = view.length()
        rootObject.put("length", lengthValue)
    }

    fun getTextSize(rootObject: JSONObject, view: TextView) {
        val textSize = view.getTextSize()
        rootObject.put("textSize", textSize)
    }

    fun getLineHeight(rootObject: JSONObject, view: TextView) {
        val lineHeight = view.getLineHeight()
        rootObject.put("lineHeight", lineHeight)
    }

    fun getHint(rootObject: JSONObject, view: TextView) {
        val hint = view.getHint()
        if (hint != null) rootObject.put("placeholder", hint.toString())
    }
}

