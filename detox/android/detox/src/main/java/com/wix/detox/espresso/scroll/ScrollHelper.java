package com.wix.detox.espresso.scroll;

import android.os.SystemClock;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;

import com.wix.detox.espresso.UiAutomatorHelper;
import com.wix.detox.espresso.common.annot.MotionDir;

import androidx.test.espresso.UiController;
import androidx.test.espresso.action.MotionEvents;

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

    private static final int SCROLL_STEPS = 50;
    private static final int SCROLL_DURATION_MS = 275;
    private static final float[] SCROLL_PRECISION = {1f, 1f};

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
            doScroll(uiController, view, direction, fullAmount);
            uiController.loopMainThreadUntilIdle();
        }

        doScroll(uiController, view, direction, remainder);
        uiController.loopMainThreadUntilIdle();
    }

    private static void doScroll(UiController uiController, View view, @MotionDir int direction, int amount) throws ScrollEdgeException {
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
        sendScrollEvent(uiController, downX, downY, upX, upY);
    }

    /**
     * This was taken from Espresso's implementation of {@link androidx.test.espresso.action.Swipe},
     * typically accessible through the {@link androidx.test.espresso.action.GeneralSwipeAction} action.
     *
     * <br/>The main differences compared to the original impl are:
     * <ol>
     *     <li>50 motion events instead of 10, which makes the overall scrolling add up to something more
     *         accurate (i.e. closer to the scrolling originally requested by the user, in DP).</li>
     *     <li>Espresso's options for overall scrolling times are SLOW=1.5s and FAST=150ms. We use 275ms
     *         (i.e. neither).</li>
     * </ol>
     *
     * TODO revisit this - consider whether we nevertheless use Espresso's code here.
     */
    private static void sendScrollEvent(UiController uiController, int downX, int downY, int upX, int upY) {
        final float[] startCoordinates = new float[]{downX, downY};
        final float[] endCoordinates = new float[]{upX, upY};
        final float[][] steps = interpolate(startCoordinates, endCoordinates);
        final int delayBetweenMovements = SCROLL_DURATION_MS / steps.length;

        final MotionEvent downEvent = MotionEvents.sendDown(uiController, startCoordinates, SCROLL_PRECISION).down;
        try {
            for (int i = 0; i < steps.length; i++) {
                if (!MotionEvents.sendMovement(uiController, downEvent, steps[i])) {
                    Log.e(LOG_TAG, "Injection of move event as part of the scroll failed. Sending cancel event.");
                    MotionEvents.sendCancel(uiController, downEvent);
                    return;
                }

                long desiredTime = downEvent.getDownTime() + delayBetweenMovements * i;
                long timeUntilDesired = desiredTime - SystemClock.uptimeMillis();
                if (timeUntilDesired > 10) {
                    uiController.loopMainThreadForAtLeast(timeUntilDesired);
                }
            }

            if (!MotionEvents.sendUp(uiController, downEvent, endCoordinates)) {
                Log.e(LOG_TAG, "Injection of up event as part of the scroll failed. Sending cancel event.");
                MotionEvents.sendCancel(uiController, downEvent);
            }
        } finally {
            downEvent.recycle();
        }

        // Ensures that all child views leave the pressed-on state, if in effect.
        // This is paramount for having consequent tap-events registered properly.
        final int androidPressedDuration = ViewConfiguration.getPressedStateDuration();
        if (androidPressedDuration > 0) {
            uiController.loopMainThreadForAtLeast(androidPressedDuration);
        }
    }

    private static float[][] interpolate(float[] start, float[] end) {
        float[][] res = new float[SCROLL_STEPS][2];

        for (int i = 1; i < SCROLL_STEPS + 1; i++) {
            res[i - 1][0] = start[0] + (end[0] - start[0]) * i / (SCROLL_STEPS + 2f);
            res[i - 1][1] = start[1] + (end[1] - start[1]) * i / (SCROLL_STEPS + 2f);
        }

        return res;
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

        if (direction == 1 || direction == 2) {
            doScroll(uiController, view, direction, adjWidth);
        } else {
            doScroll(uiController, view, direction, adjHeight);
        }

        uiController.loopMainThreadUntilIdle();
    }
}
