package com.wix.detox.espresso.scroll;

import android.view.View;

import com.wix.detox.espresso.UiAutomatorHelper;
import com.wix.detox.espresso.common.annot.MotionDir;

import androidx.test.espresso.UiController;
import kotlin.jvm.functions.Function1;

import static com.wix.detox.espresso.common.annot.MotionDefsKt.MOTION_DIR_DOWN;
import static com.wix.detox.espresso.common.annot.MotionDefsKt.MOTION_DIR_LEFT;
import static com.wix.detox.espresso.common.annot.MotionDefsKt.MOTION_DIR_RIGHT;
import static com.wix.detox.espresso.common.annot.MotionDefsKt.MOTION_DIR_UP;
import static com.wix.detox.espresso.common.annot.MotionDefsKt.isHorizontal;
import static com.wix.detox.espresso.scroll.ScrollProbesKt.getScrollableProbe;

/**
 * Created by simonracz on 09/08/2017.
 */

public class ScrollHelper {
    private static final String LOG_TAG = "DetoxScrollHelper";

    private static final int SCROLL_MOTIONS = 50;
    private static final int SCROLL_DURATION_MS = 275;

    private static final double DEFAULT_DEADZONE_PERCENT = 0.05;

    private ScrollHelper() {
        // static class
    }

    /**
     * Scrolls the View in a direction by the Density Independent Pixel amount.
     *
     * @param direction Direction to scroll (see {@link MotionDir})
     * @param amountInDP Density Independent Pixels
     *
     */
    public static void perform(UiController uiController, View view, @MotionDir int direction, double amountInDP) throws ScrollEdgeException {
        int adjWidth = 0;
        int adjHeight = 0;

        int[] pos = new int[2];
        view.getLocationInWindow(pos);

        int amountInPX = UiAutomatorHelper.convertDiptoPix(amountInDP);

        float[] screenSize = UiAutomatorHelper.getScreenSizeInPX();

        if (direction == MOTION_DIR_LEFT) {
            adjWidth = (int) ((screenSize[0] - pos[0]) * (1 - 2 * DEFAULT_DEADZONE_PERCENT));
        } else if (direction == MOTION_DIR_RIGHT) {
            adjWidth = (int) ((pos[0] + view.getWidth()) * (1 - 2 * DEFAULT_DEADZONE_PERCENT));
        } else if (direction == MOTION_DIR_UP) {
            adjHeight = (int) ((screenSize[1] - pos[1]) * (1 - 2 * DEFAULT_DEADZONE_PERCENT));
        } else {
            adjHeight = (int) ((pos[1] + view.getHeight()) * (1 - 2 * DEFAULT_DEADZONE_PERCENT));
        }

        int times;
        int remainder;
        int fullAmount;

        if (isHorizontal(direction)) {
            times = amountInPX / adjWidth;
            remainder = amountInPX % adjWidth;
            fullAmount = adjWidth;
        } else {
            times = amountInPX / adjHeight;
            remainder = amountInPX % adjHeight;
            fullAmount = adjHeight;
        }

        for (int i = 0; i < times; ++i) {
            scrollOnce(uiController, view, direction, fullAmount);
            uiController.loopMainThreadUntilIdle();
        }

        scrollOnce(uiController, view, direction, remainder);
        uiController.loopMainThreadUntilIdle();
    }

    /**
     * Scrolls the View in a direction once by the maximum amount possible. (Till the edge
     * of the screen.)
     *
     * @param direction Direction to scroll (see {@link @MotionDir})
     */
    public static void performOnce(UiController uiController, View view, @MotionDir int direction) throws ScrollEdgeException {
        int adjWidth = 0;
        int adjHeight = 0;

        int[] pos = new int[2];
        view.getLocationInWindow(pos);

        float[] screenSize = UiAutomatorHelper.getScreenSizeInPX();

        if (direction == MOTION_DIR_LEFT) {
            adjWidth = (int) ((screenSize[0] - pos[0]) * (1 - 2 * DEFAULT_DEADZONE_PERCENT));
        } else if (direction == MOTION_DIR_RIGHT) {
            adjWidth = (int) ((pos[0] + view.getWidth()) * (1 - 2 * DEFAULT_DEADZONE_PERCENT));
        } else if (direction == MOTION_DIR_UP) {
            adjHeight = (int) ((screenSize[1] - pos[1]) * (1 - 2 * DEFAULT_DEADZONE_PERCENT));
        } else {
            adjHeight = (int) ((pos[1] + view.getHeight()) * (1 - 2 * DEFAULT_DEADZONE_PERCENT));
        }

        if (isHorizontal(direction)) {
            scrollOnce(uiController, view, direction, adjWidth);
        } else {
            scrollOnce(uiController, view, direction, adjHeight);
        }

        uiController.loopMainThreadUntilIdle();
    }

    private static void scrollOnce(UiController uiController, View view, @MotionDir int direction, int amount) throws ScrollEdgeException {
        int[] pos = new int[2];
        view.getLocationInWindow(pos);
        int x = pos[0];
        int y = pos[1];

        int downX;
        int downY;
        int upX;
        int upY;

        int marginX = (int) (view.getWidth() * DEFAULT_DEADZONE_PERCENT);
        int marginY = (int) (view.getHeight() * DEFAULT_DEADZONE_PERCENT);

        switch (direction) {
            case MOTION_DIR_RIGHT:
                downX = x + view.getWidth() - marginX;
                downY = y + view.getHeight() / 2;
                upX = downX - amount;
                upY = y + view.getHeight() / 2;
                break;
            case MOTION_DIR_LEFT:
                downX = x + marginX;
                downY = y + view.getHeight() / 2;
                upX = downX + amount;
                upY = y + view.getHeight() / 2;
                break;
            case MOTION_DIR_DOWN:
                downX = x + view.getWidth() / 2;
                downY = y + view.getHeight() - marginY;
                upX = x + view.getWidth() / 2;
                upY = downY - amount;
                break;
            case MOTION_DIR_UP:
                downX = x + view.getWidth() / 2;
                downY = y + marginY;
                upX = x + view.getWidth() / 2;
                upY = downY + amount;
                break;
            default:
                throw new RuntimeException("Scroll direction can go from 1 to 4");
        }

        final ScrollableProbe scrollableProbe = getScrollableProbe(view, direction);
        if (scrollableProbe.atScrollingEdge()) {
            throw new ScrollEdgeException("View is already at the scrolling edge");
        }

        // Log.d(LOG_TAG, "scroll downx: " + downX + " downy: " + downY + " upx: " + upX + " upy: " + upY);
        doScroll(uiController, downX, downY, upX, upY);
    }

    private static void doScroll(final UiController uiController, int downX, int downY, int upX, int upY) {
        // TODO lambda
        final Function1<Integer, DetoxSwiper> swipeExecutorProvider = new Function1<Integer, DetoxSwiper>() {
            @Override
            public DetoxSwiper invoke(Integer perMotionTimeMS) {
                return new BatchedSwiper(uiController, perMotionTimeMS);
            }
        };
        final DetoxSwipe detoxSwipe = new DetoxSwipe(downX, downY, upX, upY, SCROLL_DURATION_MS, SCROLL_MOTIONS, swipeExecutorProvider);
        detoxSwipe.perform();
    }
}
