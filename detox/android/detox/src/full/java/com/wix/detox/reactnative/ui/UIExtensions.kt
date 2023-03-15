package com.wix.detox.reactnative.ui

import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import com.wix.detox.common.forEachChild
import com.wix.detox.reactnative.utils.isReactNativeObject

fun View.accessibilityLabel(
    isReactNativeObjectFn: (Any) -> Boolean = { isReactNativeObject(it) }
): CharSequence? =
    getRawAccessibilityLabel(this) ?:
        if (this is ViewGroup && isReactNativeObjectFn(this)) {
            val contentDesc = mutableListOf<CharSequence>()

            forEachChild { child ->
                child.accessibilityLabel(isReactNativeObjectFn)?.let {
                    contentDesc.add(it)
                }
            }
            if (contentDesc.isEmpty()) null else contentDesc.joinToString(" ")
        } else null

private fun getRawAccessibilityLabel(view: View): CharSequence? =
    if (view.contentDescription != null) {
        view.contentDescription
    } else if (view is TextView) {
        view.text
    } else null
