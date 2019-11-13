package com.wix.detox.espresso.scroll;

import android.content.Context;
import android.graphics.Point;
import android.util.Log;
import android.view.View;
import android.view.ViewConfiguration;

import com.wix.detox.espresso.UiAutomatorHelper;
import com.wix.detox.espresso.common.annot.MotionDir;

import androidx.test.espresso.UiController;
import androidx.test.platform.app.InstrumentationRegistry;

import static com.wix.detox.espresso.common.annot.MotionDefs.MOTION_DIR_DOWN;
import static com.wix.detox.espresso.common.annot.MotionDefs.MOTION_DIR_LEFT;
import static com.wix.detox.espresso.common.annot.MotionDefs.MOTION_DIR_RIGHT;
import static com.wix.detox.espresso.common.annot.MotionDefs.MOTION_DIR_UP;
import static com.wix.detox.espresso.scroll.ScrollProbes.getScrollableProbe;

/**
 * Created by simonracz on 09/08/2017.
 */

public class ScrollHelper {
    private static final String LOG_TAG = "DetoxScrollHelper";

    private static final int SCROLL_MOTIONS = 70;
    private static final int MAX_FLING_WAITS = 3;

    private static final double DEFAULT_DEADZONE_PERCENT = 0.05;
    private static final double SCROLL_RANGE_SAFE_PERCENT = (1 - 2 * DEFAULT_DEADZONE_PERCENT);

    private static ViewConfiguration viewConfiguration = null;

    private ScrollHelper() {
        // static class
    }

    /**
     * Scrolls the View in a direction by the Density Independent Pixel amount.
     *
     * @param direction Direction to scroll (see {@link MotionDir})
     * @param amountInDP Density Independent Pixels
     * @param startOffsetPercentX Percentage denoting where X-swipe should start, with respect to the scrollable view. Null means select automatically.
     * @param startOffsetPercentY Percentage denoting where Y-swipe should start, with respect to the scrollable view. Null means select automatically.
     */
    public static void perform(UiController uiController, View view, @MotionDir int direction, double amountInDP, Float startOffsetPercentX, Float startOffsetPercentY) throws ScrollEdgeException {
        final int amountInPx = UiAutomatorHelper.convertDiptoPix(amountInDP);
        final int safeScrollableRangePx = getViewSafeScrollableRangePix(view, direction);
        final int times = amountInPx / safeScrollableRangePx;
        final int remainder = amountInPx % safeScrollableRangePx;

        Log.d(LOG_TAG, "prescroll amountDP="+amountInDP + " amountPx="+amountInPx + " scrollableRangePx="+safeScrollableRangePx + " times="+times + " remainder="+remainder);

        for (int i = 0; i < times; ++i) {
            scrollOnce(uiController, view, direction, safeScrollableRangePx, startOffsetPercentX, startOffsetPercentY);
        }
        scrollOnce(uiController, view, direction, remainder, startOffsetPercentX, startOffsetPercentY);
    }

    /**
     * Scrolls the View in a direction once by the maximum amount possible. (Till the edge
     * of the screen.)
     *
     * @param direction Direction to scroll (see {@link @MotionDir})
     */
    public static void performOnce(UiController uiController, View view, @MotionDir int direction) throws ScrollEdgeException {
        final int scrollableRangePx = getViewSafeScrollableRangePix(view, direction);
        scrollOnce(uiController, view, direction, scrollableRangePx, null, null);
    }

    private static void scrollOnce(UiController uiController, View view, @MotionDir int direction, int userAmountPx, Float startOffsetPercentX, Float startOffsetPercentY) throws ScrollEdgeException {
        final ScrollableProbe scrollableProbe = getScrollableProbe(view, direction);
        if (scrollableProbe.atScrollingEdge()) {
            throw new ScrollEdgeException("View is already at the scrolling edge");
        }

        final Point downPoint = getScrollStartPoint(view, direction, startOffsetPercentX, startOffsetPercentY);
        final Point upPoint = getScrollEndPoint(downPoint, direction, userAmountPx, startOffsetPercentX, startOffsetPercentY);

        Log.d(LOG_TAG, "scroll " + downPoint + " --> " + upPoint);
        doScroll(view.getContext(), uiController, downPoint.x, downPoint.y, upPoint.x, upPoint.y);

        // This is, at least in theory, unnecessary, as we use a swiper implementation that effectively knows how to avoid fling.
        // Nevertheless we cannot validate all use cases in the universe, and thus in order to stay robust we assume somehow fling
        // might get registered on rare occasions. Since the runtime price is very small, it's better to be safe than sorry...
        waitForFlingToFinish(view, uiController);
    }

    private static void doScroll(final Context context, final UiController uiController, int downX, int downY, int upX, int upY) {
        final DetoxSwiper swiper = new FlinglessSwiper(SCROLL_MOTIONS, uiController, ViewConfiguration.get(context));
        final DetoxSwipe swipe = new DetoxSwipe(downX, downY, upX, upY, SCROLL_MOTIONS, swiper);
        swipe.perform();
    }

    private static void waitForFlingToFinish(View view, UiController uiController) {
        int waitTimeMS = 100; // Note: experimentation shows initial lookahead window should be large or we could miss out on future-pending events.
        int iteration = 0;
        int startX;
        int startY;
        do {
            startY = view.getScrollY();
            startX = view.getScrollX();
            uiController.loopMainThreadForAtLeast(waitTimeMS);

            waitTimeMS = 10;
            iteration++;
        } while ((view.getScrollY() != startY || view.getScrollX() != startX) && iteration < MAX_FLING_WAITS);

        if (iteration > 1) {
            Log.w(LOG_TAG, "Detected a possibly overly-running fling! (#iterations=" + iteration + ")");
        }
    }

    private static int getViewSafeScrollableRangePix(View view, @MotionDir int direction) {
        final float[] screenSize = UiAutomatorHelper.getScreenSizeInPX();
        final int[] pos = new int[2];
        view.getLocationInWindow(pos);

        int range;
        switch (direction) {
            case MOTION_DIR_LEFT: range = (int) ((screenSize[0] - pos[0]) * SCROLL_RANGE_SAFE_PERCENT); break;
            case MOTION_DIR_RIGHT: range = (int) ((pos[0] + view.getWidth()) * SCROLL_RANGE_SAFE_PERCENT); break;
            case MOTION_DIR_UP: range = (int) ((screenSize[1] - pos[1]) * SCROLL_RANGE_SAFE_PERCENT); break;
            default: range = (int) ((pos[1] + view.getHeight()) * SCROLL_RANGE_SAFE_PERCENT); break;
        }
        return range;
    }

    private static Point getScrollStartPoint(View view, @MotionDir int direction, Float startOffsetPercentX, Float startOffsetPercentY) {
        final int safetyOffset = UiAutomatorHelper.convertDiptoPix(1);

        Point point = getGlobalViewLocation(view);
        float offsetFactorX;
        float offsetFactorY;
        int safetyOffsetX;
        int safetyOffsetY;

        switch (direction) {
            case MOTION_DIR_RIGHT:
                offsetFactorX = (startOffsetPercentX != null ? startOffsetPercentX : 1f);
                offsetFactorY = (startOffsetPercentY != null ? startOffsetPercentY : 0.5f);
                safetyOffsetX = (startOffsetPercentX != null ? 0 : -safetyOffset);
                safetyOffsetY = 0;
                break;
            case MOTION_DIR_LEFT:
                offsetFactorX = (startOffsetPercentX != null ? startOffsetPercentX : 0);
                offsetFactorY = (startOffsetPercentY != null ? startOffsetPercentY : 0.5f);
                safetyOffsetX = (startOffsetPercentX != null ? 0 : safetyOffset);
                safetyOffsetY = 0;
                break;
            case MOTION_DIR_DOWN:
                offsetFactorX = (startOffsetPercentX != null ? startOffsetPercentX : 0.5f);
                offsetFactorY = (startOffsetPercentY != null ? startOffsetPercentY : 1f);
                safetyOffsetX = 0;
                safetyOffsetY = (startOffsetPercentY != null ? 0 : -safetyOffset);
                break;
            case MOTION_DIR_UP:
                offsetFactorX = (startOffsetPercentX != null ? startOffsetPercentX : 0.5f);
                offsetFactorY = (startOffsetPercentY != null ? startOffsetPercentY : 0f);
                safetyOffsetX = 0;
                safetyOffsetY = (startOffsetPercentY != null ? 0 : safetyOffset);
                break;
            default:
                throw new RuntimeException("Scroll direction can go from 1 to 4");
        }

        int offsetX = ((int) (view.getWidth() * offsetFactorX) + safetyOffsetX);
        int offsetY = ((int) (view.getHeight() * offsetFactorY) + safetyOffsetY);

        point.offset(offsetX, offsetY);
        return point;
    }

    private static Point getScrollEndPoint(Point startPoint, @MotionDir int direction, int userAmountPx, Float startOffsetPercentX, Float startOffsetPercentY) {
        int safetyOffset = UiAutomatorHelper.convertDiptoPix(1);
        int safetyOffsetX = (startOffsetPercentX != null ? safetyOffset : 0);
        int safetyOffsetY = (startOffsetPercentY != null ? safetyOffset : 0);

        int touchToScrollSlopPx = getViewConfiguration().getScaledTouchSlop();
        int amountPx = userAmountPx + touchToScrollSlopPx;

        Point point = new Point(startPoint);
        int amountX;
        int amountY;
        switch (direction) {
            case MOTION_DIR_RIGHT:
                amountX = -amountPx - safetyOffsetX;
                amountY = 0;
                break;
            case MOTION_DIR_LEFT:
                amountX = amountPx + safetyOffsetX;
                amountY = 0;
                break;
            case MOTION_DIR_DOWN:
                amountX = 0;
                amountY = -amountPx - safetyOffsetY;
                break;
            case MOTION_DIR_UP:
                amountX = 0;
                amountY = amountPx + safetyOffsetY;
                break;
            default:
                throw new RuntimeException("Scroll direction can go from 1 to 4");
        }

        point.offset(amountX, amountY);
        return point;
    }

    private static Point getGlobalViewLocation(View view) {
        int[] pos = new int[2];
        view.getLocationInWindow(pos);
        return new Point(pos[0], pos[1]);
    }

    private static ViewConfiguration getViewConfiguration() {
        if (viewConfiguration == null) {
            final Context applicationContext = InstrumentationRegistry.getInstrumentation().getTargetContext().getApplicationContext();
            viewConfiguration = ViewConfiguration.get(applicationContext);
        }
        return viewConfiguration;
    }
}
