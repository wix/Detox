package com.wix.detox.espresso.matcher

import android.R
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Rect
import android.util.DisplayMetrics
import android.util.TypedValue
import android.view.View
import android.view.WindowManager
import androidx.test.espresso.matcher.ViewMatchers
import org.hamcrest.Description
import org.hamcrest.TypeSafeDiagnosingMatcher
import kotlin.math.abs
import kotlin.math.min

/**
 * This matcher is a workaround for the issue with the `isDisplayingAtLeast` matcher.
 * Because of an issue with [View.getGlobalVisibleRect], the `isDisplayingAtLeast` matcher does not work
 * as expected with React Native views.
 * @see [React Native Issue](https://github.com/facebook/react-native/issues/23870)
 * The implementation of this matcher is based on the [isDisplayingAtLeast] matcher.
 *
 * This hack can be removed after proper fix in React Native.
 */
class IsDisplayingAtLeastDetoxMatcher(private val areaPercentage: Int) : TypeSafeDiagnosingMatcher<View>() {

    private val visibilityMatchers = ViewMatchers.withEffectiveVisibility(ViewMatchers.Visibility.VISIBLE)

    override fun describeTo(description: Description) {
        description
            .appendText("(")
            .appendDescriptionOf(visibilityMatchers)
            .appendText(" and view.getGlobalVisibleRect() covers at least ")
            .appendValue(areaPercentage)
            .appendText(" percent of the view's area)")
    }

    override fun matchesSafely(item: View, mismatchDescription: Description): Boolean {
        // First check if the view is visible using the default matcher
        if (!ViewMatchers.isDisplayingAtLeast(areaPercentage).matches(item)) {
            return false
        }

        // In case it is, we need to check if the view is actually visible by running intersection of all parent views rects
        return isDisplayingAtLeast(item, mismatchDescription)
    }

    private fun isDisplayingAtLeast(view: View, mismatchDescription: Description): Boolean {
        val viewVisibleRect = getGlobalVisibleRectWorkaround(view)
        val maxArea = getViewMaxArea(view)
        val visibleArea: Double = getViewVisibleArea(viewVisibleRect)
        val displayedPercentage = (visibleArea / maxArea * 100).toInt()

        if (displayedPercentage < areaPercentage) {
            mismatchDescription
                .appendText("view was ")
                .appendValue(displayedPercentage)
                .appendText(" percent visible to the user")
            return false
        }
        return true
    }

    /**
     * Calculate the actual visible area of the view.
     */
    private fun getViewVisibleArea(viewVisibleRect: Rect): Double {
        return (viewVisibleRect.height() * viewVisibleRect.width()).toDouble()
    }

    /**
     * Calculate the maximum possible area of the view (including the not visible part).
     */
    private fun getViewMaxArea(view: View): Double {
        val (viewWidth, viewHeight) = getViewSize(view)
        return viewWidth * viewHeight
    }

    /**
     * Calculate the actual size of the view, taking into account the scaling factor and the screen size.
     */
    private fun getViewSize(view: View): Pair<Double, Double> {
        val screenSize = getScreenWithoutStatusBarActionBar(view)
        val viewWidth = min((view.width * abs(view.scaleX.toDouble())), screenSize.width().toDouble())
        val viewHeight = min((view.height * abs(view.scaleY.toDouble())), screenSize.height().toDouble())
        return Pair(viewWidth, viewHeight)
    }

    /**
     * Traverse the view hierarchy and calculate the intersection of all parent views with the given view.
     *
     * @return The actual visible rectangle of the view.
     */
    private fun getGlobalVisibleRectWorkaround(view: View): Rect {
        var currentParent = view.parent as? View

        val calculatedVisibleRect = Rect()
        view.getGlobalVisibleRect(calculatedVisibleRect)

        while (currentParent != null) {
            val parentVisibleRectangle = Rect()
            // Fill the visible rectangle of the parent view
            currentParent.getGlobalVisibleRect(parentVisibleRectangle)

            // The viewVisibleRect will be replaced with the intersection of the viewVisibleRect and the parentVisibleRectangle
            if (!calculatedVisibleRect.intersect(parentVisibleRectangle)) {
                return Rect()
            }

            currentParent = currentParent.parent as? View
        }

        return calculatedVisibleRect
    }

    private fun getScreenWithoutStatusBarActionBar(view: View): Rect {
        val m = DisplayMetrics()
        (view.context.getSystemService(Context.WINDOW_SERVICE) as WindowManager)
            .defaultDisplay
            .getMetrics(m)

        val statusBarHeight = getStatusBarHeightPixels(view)
        val actionBarHeight = getActionBarHeight(view)
        return Rect(0, 0, m.widthPixels, m.heightPixels - (statusBarHeight + actionBarHeight))
    }

    private fun getActionBarHeight(view: View): Int {
        val tv = TypedValue()
        val actionBarHeight = if (view.context.theme.resolveAttribute(R.attr.actionBarSize, tv, true)) {
            TypedValue.complexToDimensionPixelSize(
                tv.data, view.context.resources.displayMetrics
            )
        } else {
            0
        }
        return actionBarHeight
    }

    @SuppressLint("InternalInsetResource", "DiscouragedApi")
    private fun getStatusBarHeightPixels(view: View): Int {
        val resourceId = view.context.resources.getIdentifier("status_bar_height", "dimen", "android")
        return if (resourceId > 0) view.context.resources.getDimensionPixelSize(resourceId) else 0
    }
}
