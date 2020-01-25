@file:JvmName("ScrollProbes")

package com.wix.detox.espresso.scroll

import android.annotation.SuppressLint
import android.view.View
import android.widget.AbsListView
import com.wix.detox.espresso.common.annot.*

// TODO ViewPager?
fun getScrollableProbe(view: View, @MotionDir direction: Int): ScrollableProbe {
    if (view is AbsListView) {
        @SuppressLint("SwitchIntDef")
        when (direction) {
            MOTION_DIR_UP -> return AbsListViewBack(view)
            MOTION_DIR_DOWN -> return AbsListViewForward(view)
        }
    }

    return when (direction) {
        MOTION_DIR_LEFT -> ScrollableProbeHBack(view)
        MOTION_DIR_RIGHT -> ScrollableProbeHForward(view)
        MOTION_DIR_UP -> ScrollableProbeVBack(view)
        MOTION_DIR_DOWN -> ScrollableProbeVForward(view)
        else -> throw IllegalArgumentException("Invalid direction: $direction")
    }
}

interface ScrollableProbe {
    fun atScrollingEdge(): Boolean
}

private abstract class AbsScrollableProbe(val view: View) : ScrollableProbe

private class ScrollableProbeHBack(view: View) : AbsScrollableProbe(view) {
    override fun atScrollingEdge() = !view.canScrollHorizontally(-1)
}

private class ScrollableProbeHForward(view: View) : AbsScrollableProbe(view) {
    override fun atScrollingEdge() = !view.canScrollHorizontally(1)
}

private class ScrollableProbeVBack(view: View) : AbsScrollableProbe(view) {
    override fun atScrollingEdge() = !view.canScrollVertically(-1)
}

private class ScrollableProbeVForward(view: View) : AbsScrollableProbe(view) {
    override fun atScrollingEdge() = !view.canScrollVertically(1)
}

private class AbsListViewBack(val view: AbsListView) : ScrollableProbe {
    override fun atScrollingEdge(): Boolean {
        // Ported from AbsListView#canScrollList() which isn't compatible with all API levels
        val firstTop = view.getChildAt(0).top
        val firstPosition = view.firstVisiblePosition
        return firstPosition > 0 || firstTop < view.listPaddingTop
    }
}

private class AbsListViewForward(val view: AbsListView) : ScrollableProbe {
    override fun atScrollingEdge(): Boolean {
        // Ported from AbsListView#canScrollList() which isn't compatible with all API levels
        val itemsCount = view.count
        val childCount = view.childCount
        val firstPosition = view.firstVisiblePosition
        val lastPosition = firstPosition + childCount
        val lastBottom = view.getChildAt(childCount - 1).bottom
        return (lastPosition < itemsCount) || (lastBottom > (view.height - view.listPaddingBottom))
    }
}
