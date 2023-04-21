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

/**
 * In-order traverse the view-hierarchy specified by a view, considered to be the hierarchy's root.
 *
 * @param view The hierarchy's root-view.
 * @param callback A function to call per each view. Returning `false` from the callback indicates
 *  a request to refrain from traversing the sub-hierarchy associated with the current view.
 */
fun traverseViewHierarchy(view: View, callback: (view: View) -> Boolean) {
    if (callback(view)) {
        view.forEachChild { child ->
            traverseViewHierarchy(child, callback)
        }
    }
}
