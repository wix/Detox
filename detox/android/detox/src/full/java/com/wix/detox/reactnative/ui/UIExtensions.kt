package com.wix.detox.reactnative.ui

import android.view.View
import android.widget.TextView
import com.wix.detox.common.traverseViewHierarchy
import com.wix.detox.reactnative.utils.isReactNativeObject

fun View.getAccessibilityLabel(
    isReactNativeObjectFn: (Any) -> Boolean = { isReactNativeObject(it) }
): CharSequence? =
    if (isReactNativeObjectFn(this)) {
        val subLabels = collectAccessibilityLabelsFromHierarchy(this)
        if (subLabels.isEmpty()) null else subLabels.joinToString(" ")
    } else {
        getRawAccessibilityLabel(this)
    }

private fun collectAccessibilityLabelsFromHierarchy(
    rootView: View,
    subLabels: MutableList<CharSequence> = mutableListOf(),
): List<CharSequence> {
    traverseViewHierarchy(rootView) { view ->
        getRawAccessibilityLabel(view)?.let { rawLabel ->
            subLabels.add(rawLabel)
            false
        } ?: true

    }
    return subLabels
}

private fun getRawAccessibilityLabel(view: View): CharSequence? =
    if (view.contentDescription != null) {
        view.contentDescription
    } else if (view is TextView) {
        view.text
    } else null
