package com.wix.detox.espresso;

import android.support.test.espresso.UiController;
import android.support.test.espresso.ViewAction;
import android.util.Log;
import android.view.View;

import org.hamcrest.Matcher;
import org.joor.Reflect;

import static android.support.test.espresso.matcher.ViewMatchers.isAssignableFrom;


/**
 * Created by simonracz on 10/07/2017.
 */

public class DetoxAction {
    private static final String LOG_TAG = "detox";

    // More steps slows the swipe and prevents contents from being flung too far
    private static final int SCROLL_STEPS = 55;

    private static final int FLING_STEPS = 5;

    // Restrict a swipe's starting and ending points inside a 10% margin of the target
    private static final double DEFAULT_DEADZONE_PERCENT = 0.1;

    // Method from UiAutomator's InteractionController
    private static final String METHOD_SCROLL_SWIPE = "scrollSwipe";

    private DetoxAction() {
        // static class
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
     */
    public static ViewAction scrollInDirection(final int direction, final int amountInDP) {
        return new ViewAction() {
            @Override
            public Matcher<View> getConstraints() {
                return isAssignableFrom(View.class);
            }

            @Override
            public String getDescription() {
                return "scrollInDirection";
            }

            private void doScroll(UiController uiController, View view, int amount) {
                int[] pos = new int[2];
                view.getLocationInWindow(pos);
                int x = pos[0];
                int y = pos[1];

                int downX = 0;
                int downY = 0;
                int upX = 0;
                int upY = 0;

                int marginX = (int) (view.getWidth() * DEFAULT_DEADZONE_PERCENT);
                int marginY = (int) (view.getHeight() * DEFAULT_DEADZONE_PERCENT);

                switch (direction) {
                    case 1:
                        downX = x + marginX + amount;
                        downY = y + view.getHeight() / 2;
                        upX = x + marginX;
                        upY = y + view.getHeight() / 2;
                        break;
                    // FINISH 2, 3, 4
                    case 2:
                        downX = x + marginX;
                        downY = y + view.getHeight() / 2;
                        upX = x + marginX + amount;
                        upY = y + view.getHeight() / 2;
                        break;
                    case 3:
                        downX = x + view.getWidth() / 2;
                        downY = y + marginY + amount;
                        upX = x + view.getWidth() / 2;
                        upY = y + marginY;
                        break;
                    case 4:
                        downX = x + view.getWidth() / 2;
                        downY = y + marginY;
                        upX = x + view.getWidth() / 2;
                        upY = y + marginY + amount;
                        break;
                    default:
                        throw new RuntimeException("Scrolldirection can go from 1 to 4");
                }
                boolean ret = Reflect.on(UiAutomatorHelper.getInteractionController())
                        .call(METHOD_SCROLL_SWIPE, downX, downY, upX, upY, SCROLL_STEPS).get();
                Log.v(LOG_TAG, "ScrollSwipe; scroll ended : " + String.valueOf(ret));
            }

            @Override
            public void perform(UiController uiController, View view) {
                int adjWidth = (int) (view.getWidth() * 2 * DEFAULT_DEADZONE_PERCENT);
                int adjHeight = (int) (view.getHeight() * 2 * DEFAULT_DEADZONE_PERCENT);

                int amountInPX = UiAutomatorHelper.convertDiptoPix(amountInDP);

                int times;
                int remainder;
                int fullAmount;

                if (direction == 1 || direction == 2) {
                    times = amountInPX / adjWidth;
                    remainder = amountInPX % adjWidth;
                    fullAmount = adjWidth;
                } else {
                    times = amountInPX / adjHeight;
                    remainder = amountInPX % adjHeight;
                    fullAmount = adjHeight;
                }

                for (int i = 0; i < times; ++i) {
                    doScroll(uiController, view, fullAmount);
                    uiController.loopMainThreadUntilIdle();
                }

                doScroll(uiController, view, remainder);
                uiController.loopMainThreadUntilIdle();
            }
        };

    }

}
