package com.wix.detox.espresso.action

import android.view.View
import android.view.ViewGroup
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.matcher.ViewMatchers
import com.facebook.react.views.scroll.ReactHorizontalScrollView
import com.facebook.react.views.scroll.ReactScrollView
import com.wix.detox.action.common.MOTION_DIR_DOWN
import com.wix.detox.action.common.MOTION_DIR_LEFT
import com.wix.detox.action.common.MOTION_DIR_RIGHT
import com.wix.detox.action.common.MOTION_DIR_UP
import com.wix.detox.espresso.scroll.ScrollEdgeException
import com.wix.detox.espresso.scroll.ScrollHelper
import org.hamcrest.Matcher
import org.hamcrest.Matchers

class ScrollToIndexAction(private val index: Int) : ViewAction {
    override fun getConstraints(): Matcher<View> {
        return Matchers.anyOf(
            Matchers.allOf(
                ViewMatchers.isAssignableFrom(
                    View::class.java
                ), Matchers.instanceOf(
                    ReactScrollView::class.java
                )
            ),
            Matchers.allOf(
                ViewMatchers.isAssignableFrom(
                    View::class.java
                ), Matchers.instanceOf(ReactHorizontalScrollView::class.java)
            )
        )
    }

    override fun getDescription(): String {
        return "scrollToIndex"
    }

    override fun perform(uiController: UiController?, view: View?) {
        if (index < 0) return

        val offsetPercent = 0.4f
        val reactScrollView = view as ViewGroup
        val internalContainer = reactScrollView.getChildAt(0) as ViewGroup
        val childCount = internalContainer.childCount
        if (index >= childCount) return

        val isHorizontalScrollView = getIsHorizontalScrollView(reactScrollView)
        val targetPosition = getTargetPosition(isHorizontalScrollView, internalContainer, index)
        var currentPosition = getCurrentPosition(isHorizontalScrollView, reactScrollView)
        val jumpSize = getTargetDimension(isHorizontalScrollView, internalContainer, index)
        val scrollDirection =
            getScrollDirection(isHorizontalScrollView, currentPosition, targetPosition)

        // either we'll find the target view or we'll hit the edge of the scrollview

        // either we'll find the target view or we'll hit the edge of the scrollview
        while (true) {
            if (Math.abs(currentPosition - targetPosition) < jumpSize) {
                // we found the target view
                return
            }
            currentPosition = try {
                ScrollHelper.perform(
                    uiController,
                    view,
                    scrollDirection,
                    jumpSize.toDouble(),
                    offsetPercent,
                    offsetPercent
                )
                getCurrentPosition(isHorizontalScrollView, reactScrollView)
            } catch (e: ScrollEdgeException) {
                // we hit the edge
                return
            }
        }
    }

}

private fun getScrollDirection(
    isHorizontalScrollView: Boolean,
    currentPosition: Int,
    targetPosition: Int
): Int {
    return if (isHorizontalScrollView) {
        if (currentPosition < targetPosition) MOTION_DIR_RIGHT else MOTION_DIR_LEFT
    } else {
        if (currentPosition < targetPosition) MOTION_DIR_DOWN else MOTION_DIR_UP
    }
}

private fun getIsHorizontalScrollView(scrollView: ViewGroup): Boolean {
    return scrollView.canScrollHorizontally(1) || scrollView.canScrollHorizontally(-1)
}

private fun getCurrentPosition(isHorizontalScrollView: Boolean, scrollView: ViewGroup): Int {
    return if (isHorizontalScrollView) scrollView.scrollX else scrollView.scrollY
}

private fun getTargetDimension(
    isHorizontalScrollView: Boolean,
    internalContainer: ViewGroup,
    index: Int
): Int {
    return if (isHorizontalScrollView) internalContainer.getChildAt(index).measuredWidth else internalContainer.getChildAt(
        index
    ).measuredHeight
}

private fun getTargetPosition(
    isHorizontalScrollView: Boolean,
    internalContainer: ViewGroup,
    index: Int
): Int {
    var necessaryTarget = 0
    for (childIndex in 0 until index) {
        necessaryTarget += if (isHorizontalScrollView) internalContainer.getChildAt(childIndex).measuredWidth else internalContainer.getChildAt(
            childIndex
        ).measuredHeight
    }
    return necessaryTarget
}