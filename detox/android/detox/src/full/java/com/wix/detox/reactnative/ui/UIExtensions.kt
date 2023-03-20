package com.wix.detox.reactnative.ui

import android.view.View
import android.widget.TextView
import com.wix.detox.common.forEachChild
import com.wix.detox.reactnative.utils.isReactNativeObject

fun View.getAccessibilityLabel(
    isReactNativeObjectFn: (Any) -> Boolean = { isReactNativeObject(it) }
): CharSequence? =
    if (isReactNativeObjectFn(this)) {
        val subLabels = collectChildAccessibilityLabels(this)
        if (subLabels.isEmpty()) null else subLabels.joinToString(" ")
    } else {
        getRawAccessibilityLabel(this)
    }

private fun collectChildAccessibilityLabels(
    view: View,
    subLabels: MutableList<CharSequence> = mutableListOf(),
): List<CharSequence>{
    getRawAccessibilityLabel(view).let { rawLabel ->
        if (rawLabel != null) {
            subLabels.add(rawLabel)
        } else {
            view.forEachChild { child ->
                collectChildAccessibilityLabels(child, subLabels)
            }
        }
    }
    return subLabels
}

private fun getRawAccessibilityLabel(view: View): CharSequence? =
    if (view.contentDescription != null) {
        view.contentDescription
    } else if (view is TextView) {
        view.text
    } else null
