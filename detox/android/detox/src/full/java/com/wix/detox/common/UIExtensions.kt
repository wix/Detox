package com.wix.detox.common

import android.view.View
import android.view.ViewGroup

fun ViewGroup.forEachChild(callback: (child: View) -> Unit) {
    for (index in 0 until childCount) {
        val child = getChildAt(index)
        callback(child)
    }
}
