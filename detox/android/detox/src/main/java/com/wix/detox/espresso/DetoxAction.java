package com.wix.detox.espresso;

import android.view.View;

import com.wix.detox.common.DetoxErrors;
import com.wix.detox.common.DetoxErrors.DetoxRuntimeException;
import com.wix.detox.common.DetoxErrors.StaleActionException;
import com.wix.detox.espresso.action.DetoxMultiTap;
import com.wix.detox.espresso.action.RNClickAction;
import com.wix.detox.espresso.action.TakeViewScreenshotAction;
import com.wix.detox.espresso.common.annot.MotionDir;
import com.wix.detox.espresso.scroll.ScrollEdgeException;
import com.wix.detox.espresso.scroll.ScrollHelper;
import com.wix.detox.espresso.scroll.SwipeHelper;

import org.hamcrest.Matcher;

import androidx.test.espresso.UiController;
import androidx.test.espresso.ViewAction;
import androidx.test.espresso.action.CoordinatesProvider;
import androidx.test.espresso.action.GeneralClickAction;
import androidx.test.espresso.action.GeneralLocation;
import androidx.test.espresso.action.GeneralSwipeAction;
import androidx.test.espresso.action.Press;
import androidx.test.espresso.action.ViewActions;

import static androidx.test.espresso.action.ViewActions.actionWithAssertions;
import static androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static com.wix.detox.espresso.common.annot.MotionDefs.MOTION_DIR_DOWN;
import static com.wix.detox.espresso.common.annot.MotionDefs.MOTION_DIR_LEFT;
import static com.wix.detox.espresso.common.annot.MotionDefs.MOTION_DIR_RIGHT;
import static com.wix.detox.espresso.common.annot.MotionDefs.MOTION_DIR_UP;
import static org.hamcrest.Matchers.allOf;


/**
 * Created by simonracz on 10/07/2017.
 */

public class DetoxAction {
    private static final String LOG_TAG = "detox";

    private DetoxAction() {
        // static class
    }

    public static ViewAction multiClick(int times) {
        return actionWithAssertions(new GeneralClickAction(new DetoxMultiTap(times), GeneralLocation.CENTER, Press.FINGER, 0, 0));
    }

    public static ViewAction tapAtLocation(final int x, final int y) {
        final int px = UiAutomatorHelper.convertDiptoPix(x);
        final int py = UiAutomatorHelper.convertDiptoPix(y);
        CoordinatesProvider c = new CoordinatesProvider() {
            @Override
            public float[] calculateCoordinates(View view) {
                final int[] xy = new int[2];
                view.getLocationOnScreen(xy);
                final float fx = xy[0] + px;
                final float fy = xy[1] + py;
                return new float[] {fx, fy};
            }
        };
        return actionWithAssertions(new RNClickAction(c));
    }

    /**
     * Scrolls to the edge of the given scrollable view.
     *
     * @param edge Direction to scroll (see {@link MotionDir})
     * @return ViewAction
     */
    public static ViewAction scrollToEdge(final int edge) {
        return actionWithAssertions(new ViewAction() {
            @Override
            public Matcher<View> getConstraints() {
                return allOf(isAssignableFrom(View.class), isDisplayed());
            }

            @Override
            public String getDescription() {
                return "scrollToEdge";
            }

            @Override
            public void perform(UiController uiController, View view) {
                try {
                    for (int i = 0; i < 100; i++) {
                        ScrollHelper.performOnce(uiController, view, edge);
                    }
                    throw new DetoxRuntimeException("Scrolling a lot without reaching the edge: force-breaking the loop");
                } catch (ScrollEdgeException e) {
                    // Done
                }
            }
        });
    }

    /**
     * Scrolls the View in a direction by the Density Independent Pixel amount.
     *
     * @param direction Direction to scroll (see {@link MotionDir})
     * @param amountInDP Density Independent Pixels
     * @param startOffsetPercentX Percentage denoting where X-swipe should start, with respect to the scrollable view.
     * @param startOffsetPercentY Percentage denoting where Y-swipe should start, with respect to the scrollable view.
     */
    public static ViewAction scrollInDirection(final int direction, final double amountInDP, double startOffsetPercentX, double startOffsetPercentY) {
        final Float _startOffsetPercentX = startOffsetPercentX < 0 ? null : (float) startOffsetPercentX;
        final Float _startOffsetPercentY = startOffsetPercentY < 0 ? null : (float) startOffsetPercentY;
        return actionWithAssertions(new ViewAction() {
            @Override
            public Matcher<View> getConstraints() {
                return allOf(isAssignableFrom(View.class), isDisplayed());
            }

            @Override
            public String getDescription() {
                return "scrollInDirection";
            }

            @Override
            public void perform(UiController uiController, View view) {
                try {
                    ScrollHelper.perform(uiController, view, direction, amountInDP, _startOffsetPercentX, _startOffsetPercentY);
                } catch (Exception e) {
                    throw new DetoxRuntimeException(e);
                }
            }
        });
    }

    /**
     * Scroll the view in a direction by a specified amount (DP units).
     * <br/>Similar to {@link #scrollInDirection(int, double, double, double)}, but stops <b>gracefully</b> in the case
     * where the scrolling-edge is reached, by throwing the {@link StaleActionException} exception (i.e.
     * so as to make this use case manageable by the user).
     *
     * @param direction Direction to scroll (see {@link MotionDir})
     * @param amountInDP Density Independent Pixels
     * @param startOffsetPercentX Percentage denoting where X-swipe should start, with respect to the scrollable view.
     * @param startOffsetPercentY Percentage denoting where Y-swipe should start, with respect to the scrollable view.
     */
    public static ViewAction scrollInDirectionStaleAtEdge(final int direction, final double amountInDP, double startOffsetPercentX, double startOffsetPercentY) {
        final Float _startOffsetPercentX = startOffsetPercentX < 0 ? null : (float) startOffsetPercentX;
        final Float _startOffsetPercentY = startOffsetPercentY < 0 ? null : (float) startOffsetPercentY;
        return actionWithAssertions(new ViewAction() {
            @Override
            public Matcher<View> getConstraints() {
                return allOf(isAssignableFrom(View.class), isDisplayed());
            }

            @Override
            public String getDescription() {
                return "scrollInDirectionStaleAtEdge";
            }

            @Override
            public void perform(UiController uiController, View view) {
                try {
                    ScrollHelper.perform(uiController, view, direction, amountInDP, _startOffsetPercentX, _startOffsetPercentY);
                } catch (ScrollEdgeException exScrollAtEdge) {
                    throw new StaleActionException(exScrollAtEdge);
                }
            }
        });
    }

    /**
     * Swipes the View in a direction.
     *
     * @param direction Direction to swipe (see {@link MotionDir})
     * @param fast true if fast, false if slow
     * @param normalizedOffset or "swipe amount" between 0.0 and 1.0, relative to the screen width/height
     * @param normalizedStartingPointX X coordinate of swipe starting point (between 0.0 and 1.0), relative to the view width
     * @param normalizedStartingPointY Y coordinate of swipe starting point (between 0.0 and 1.0), relative to the view height
     */
    public static ViewAction swipeInDirection(final int direction, boolean fast, double normalizedOffset, double normalizedStartingPointX, double normalizedStartingPointY) {
        SwipeHelper swipeHelper = SwipeHelper.getDefault();
        return swipeHelper.swipeInDirection(direction, fast, normalizedOffset, normalizedStartingPointX, normalizedStartingPointY);
    }

    public static ViewAction takeViewScreenshot() {
        return new TakeViewScreenshotAction();
    }
}
