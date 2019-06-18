package com.wix.detox.espresso;

import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;

import com.wix.detox.espresso.DetoxErrors.DetoxRuntimeException;
import com.wix.detox.espresso.DetoxErrors.StaleActionException;
import com.wix.detox.espresso.common.annot.MotionDir;
import com.wix.detox.espresso.scroll.ScrollEdgeException;
import com.wix.detox.espresso.scroll.ScrollHelper;

import org.hamcrest.Matcher;

import androidx.test.espresso.UiController;
import androidx.test.espresso.ViewAction;
import androidx.test.espresso.action.CoordinatesProvider;
import androidx.test.espresso.action.GeneralClickAction;
import androidx.test.espresso.action.GeneralLocation;
import androidx.test.espresso.action.GeneralSwipeAction;
import androidx.test.espresso.action.Press;
import androidx.test.espresso.action.Swipe;
import androidx.test.espresso.action.Tap;

import static androidx.test.espresso.action.ViewActions.actionWithAssertions;
import static androidx.test.espresso.action.ViewActions.swipeDown;
import static androidx.test.espresso.action.ViewActions.swipeLeft;
import static androidx.test.espresso.action.ViewActions.swipeRight;
import static androidx.test.espresso.action.ViewActions.swipeUp;
import static androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static com.wix.detox.espresso.common.annot.MotionDefsKt.MOTION_DIR_DOWN;
import static com.wix.detox.espresso.common.annot.MotionDefsKt.MOTION_DIR_LEFT;
import static com.wix.detox.espresso.common.annot.MotionDefsKt.MOTION_DIR_RIGHT;
import static com.wix.detox.espresso.common.annot.MotionDefsKt.MOTION_DIR_UP;
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
        return actionWithAssertions(new GeneralClickAction(new MultiTap(times), GeneralLocation.CENTER, Press.FINGER, 0, 0));
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
                float[] coordinates = {fx, fy};
                return coordinates;
            }
        };
        return actionWithAssertions(new GeneralClickAction(
                Tap.SINGLE, c, Press.FINGER, InputDevice.SOURCE_UNKNOWN, MotionEvent.BUTTON_PRIMARY));
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
     */
    public static ViewAction scrollInDirection(final int direction, final double amountInDP) {
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
                    ScrollHelper.perform(uiController, view, direction, amountInDP);
                } catch (Exception e) {
                    throw new DetoxRuntimeException(e);
                }
            }
        });
    }

    /**
     * Scroll the view in a direction by a specified amount (DP units).
     * <br/>Similar to {@link #scrollInDirection(int, double)}, but stops <b>gracefully</b> in the case
     * where the scrolling-edge is reached, by throwing the {@link StaleActionException} exception (i.e.
     * so as to make this use case manageable by the user).
     *
     * @param direction Direction to scroll (see {@link MotionDir})
     * @param amountInDP Density Independent Pixels
     */
    public static ViewAction scrollInDirectionStaleAtEdge(final int direction, final double amountInDP) {
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
                    ScrollHelper.perform(uiController, view, direction, amountInDP);
                } catch (ScrollEdgeException exScrollAtEdge) {
                    throw new StaleActionException(exScrollAtEdge);
                }
            }
        });
    }

    private final static float EDGE_FUZZ_FACTOR = 0.083f;

    /**
     * Swipes the View in a direction.
     *
     * @param direction Direction to swipe (see {@link MotionDir})
     * @param fast true if fast, false if slow
     *
     */
    public static ViewAction swipeInDirection(final int direction, boolean fast) {
        if (fast) {
            switch (direction) {
                case MOTION_DIR_LEFT:
                    return swipeLeft();
                case MOTION_DIR_RIGHT:
                    return swipeRight();
                case MOTION_DIR_UP:
                    return swipeUp();
                case MOTION_DIR_DOWN:
                    return swipeDown();
                default:
                    throw new RuntimeException("Unsupported swipe direction: " + direction);
            }
        }

        switch (direction) {
            case MOTION_DIR_LEFT:
                return actionWithAssertions(new GeneralSwipeAction(Swipe.SLOW,
                        translate(GeneralLocation.CENTER_RIGHT, -EDGE_FUZZ_FACTOR, 0),
                        GeneralLocation.CENTER_LEFT, Press.FINGER));
            case MOTION_DIR_RIGHT:
                return actionWithAssertions(new GeneralSwipeAction(Swipe.SLOW,
                        translate(GeneralLocation.CENTER_LEFT, EDGE_FUZZ_FACTOR, 0),
                        GeneralLocation.CENTER_RIGHT, Press.FINGER));
            case MOTION_DIR_UP:
                return actionWithAssertions(new GeneralSwipeAction(Swipe.SLOW,
                        translate(GeneralLocation.BOTTOM_CENTER, 0, -EDGE_FUZZ_FACTOR),
                        GeneralLocation.TOP_CENTER, Press.FINGER));
            case MOTION_DIR_DOWN:
                return actionWithAssertions(new GeneralSwipeAction(Swipe.SLOW,
                        translate(GeneralLocation.TOP_CENTER, 0, EDGE_FUZZ_FACTOR),
                        GeneralLocation.BOTTOM_CENTER, Press.FINGER));
            default:
                throw new RuntimeException("Unsupported swipe direction: " + direction);
        }
    }

    private static CoordinatesProvider translate(final CoordinatesProvider coords,
                                                 final float dx, final float dy) {
        return new CoordinatesProvider() {
            @Override
            public float[] calculateCoordinates(View view) {
                float xy[] = coords.calculateCoordinates(view);
                xy[0] += dx * view.getWidth();
                xy[1] += dy * view.getHeight();
                return xy;
            }
        };
    }
}
