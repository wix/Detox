package com.wix.detox.common

import android.view.View
import android.view.ViewGroup

fun View.forEachChild(callback: (child: View) -> Unit) {
    if (this is ViewGroup) {
        for (index in 0 until childCount) {
            val child = getChildAt(index)
            callback(child)
        }
    }
}
