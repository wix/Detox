package com.wix.detox.espresso;

import android.support.test.espresso.UiController;
import android.support.test.espresso.ViewAction;
import android.support.test.espresso.action.CoordinatesProvider;
import android.support.test.espresso.action.GeneralClickAction;
import android.support.test.espresso.action.GeneralLocation;
import android.support.test.espresso.action.Press;
import android.support.test.espresso.action.Tap;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;
import android.widget.AbsListView;

import org.hamcrest.Matcher;

import static android.support.test.espresso.action.ViewActions.actionWithAssertions;
import static android.support.test.espresso.matcher.ViewMatchers.isAssignableFrom;
import static android.support.test.espresso.matcher.ViewMatchers.isDisplayed;
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
     * Edge
     * 1 -> Left
     * 2 -> Right
     * 3 -> Top
     * 4 -> Bottom
     *
     * @param edge
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
                if (view instanceof AbsListView) {
                    RNScrollListener l = new RNScrollListener((AbsListView) view);
                    do {
                        ScrollHelper.perform(uiController, view, edge, 100);
                    } while (l.didScroll());
                    l.cleanup();
                    uiController.loopMainThreadUntilIdle();
                } else {
                    throw new RuntimeException("Only descendants of AbsListView are supported");
                }
            }
        });
    }

    /**
     * Scrolls the View in a direction by the Density Independent Pixel amount.
     *
     * Direction
     * 1 -> left
     * 2 -> Right
     * 3 -> Up
     * 4 -> Down
     *
     * @param direction Direction to scroll
     * @param amountInDP Density Independent Pixels
     *
     */
    public static ViewAction scrollInDirection(final int direction, final float amountInDP) {
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
                ScrollHelper.perform(uiController, view, direction, amountInDP);
            }
        });
    }

}
