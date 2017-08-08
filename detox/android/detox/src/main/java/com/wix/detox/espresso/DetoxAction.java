package com.wix.detox.espresso;

import android.os.SystemClock;
import android.support.test.espresso.UiController;
import android.support.test.espresso.ViewAction;
import android.support.test.espresso.action.CoordinatesProvider;
import android.support.test.espresso.action.GeneralClickAction;
import android.support.test.espresso.action.GeneralLocation;
import android.support.test.espresso.action.MotionEvents;
import android.support.test.espresso.action.Press;
import android.support.test.espresso.action.Tap;
import android.util.Log;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;

import org.hamcrest.Matcher;
import org.joor.Reflect;

import static android.support.test.espresso.action.ViewActions.actionWithAssertions;
import static android.support.test.espresso.matcher.ViewMatchers.isAssignableFrom;
import static android.support.test.espresso.matcher.ViewMatchers.isDisplayed;
import static org.hamcrest.Matchers.allOf;


/**
 * Created by simonracz on 10/07/2017.
 */

public class DetoxAction {
    private static final String LOG_TAG = "detox";

    private static final int SCROLL_STEPS = 50;
    private static final int SCROLL_DURATION_MS = 100;

    private static final double DEFAULT_DEADZONE_PERCENT = 0.05;

    // Method from UiAutomator's InteractionController
    private static final String METHOD_SCROLL_SWIPE = "scrollSwipe";

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
                int adjWidth = (int) (view.getWidth() * (1 - 2 * DEFAULT_DEADZONE_PERCENT));
                int adjHeight = (int) (view.getHeight() * (1 - 2 * DEFAULT_DEADZONE_PERCENT));

                int amountInPX = UiAutomatorHelper.convertDiptoPix(amountInDP);

                Log.d(LOG_TAG, "Amount in px: " + amountInPX);

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

                Log.d(LOG_TAG, "Scroll times: " + times + " rem: " + remainder + " full: " +fullAmount);

                for (int i = 0; i < times; ++i) {
                    doScroll(uiController, view, fullAmount);
                    uiController.loopMainThreadUntilIdle();
                }

                doScroll(uiController, view, remainder);
                uiController.loopMainThreadUntilIdle();
            }

            private boolean doScroll(UiController uiController, View view, int amount) {
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
                    case 2:
                        downX = x + marginX + amount;
                        downY = y + view.getHeight() / 2;
                        upX = x + marginX;
                        upY = y + view.getHeight() / 2;
                        break;
                    case 1:
                        downX = x + marginX;
                        downY = y + view.getHeight() / 2;
                        upX = x + marginX + amount;
                        upY = y + view.getHeight() / 2;
                        break;
                    case 4:
                        downX = x + view.getWidth() / 2;
                        downY = y + marginY + amount;
                        upX = x + view.getWidth() / 2;
                        upY = y + marginY;
                        break;
                    case 3:
                        downX = x + view.getWidth() / 2;
                        downY = y + marginY;
                        upX = x + view.getWidth() / 2;
                        upY = y + marginY + amount;
                        break;
                    default:
                        throw new RuntimeException("Scrolldirection can go from 1 to 4");
                }
                Log.d(LOG_TAG, "scroll downx: " + downX + " downy: " + downY + " upx: " + upX + " upy: " + upY);
                return sendScrollEvent(uiController, downX, downY, upX, upY);
            }

            private boolean sendScrollEvent(UiController uiController, int downX, int downY, int upX, int upY) {
                float[] startCoordinates = new float[]{downX, downY};
                float[] endCoordinates = new float[]{upX, upY};
                float[] precision = new float[]{16f, 16f};
                float[][] steps = interpolate(startCoordinates, endCoordinates, SCROLL_STEPS);
                final int delayBetweenMovements = SCROLL_DURATION_MS / steps.length;

                MotionEvent downEvent = MotionEvents.sendDown(uiController, startCoordinates, precision).down;
                try {
                    for (int i = 0; i < steps.length; i++) {
                        if (!MotionEvents.sendMovement(uiController, downEvent, steps[i])) {
                            Log.e(LOG_TAG, "Injection of move event as part of the scroll failed. Sending cancel event.");
                            MotionEvents.sendCancel(uiController, downEvent);
                            return false;
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
                        return false;
                    }
                } finally {
                    downEvent.recycle();
                }
                return true;
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
     * @deprecated in favor of {@link #scrollInDirection}
     */
    @Deprecated
    public static ViewAction scrollInDirectionWithUiAutomation(final int direction, final float amountInDP) {
        return new ViewAction() {
            @Override
            public Matcher<View> getConstraints() {
                return allOf(isAssignableFrom(View.class), isDisplayed());
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
                Log.d(LOG_TAG, "scroll downx: " + downX + " downy: " + downY + " upx: " + upX + " upy: " + upY);
                boolean ret = Reflect.on(UiAutomatorHelper.getInteractionController())
                        .call(METHOD_SCROLL_SWIPE, downX, downY, upX, upY, SCROLL_STEPS).get();
                Log.v(LOG_TAG, "ScrollSwipe; scroll ended : " + String.valueOf(ret));
            }

            @Override
            public void perform(UiController uiController, View view) {
                int adjWidth = (int) (view.getWidth() * (1 - 2 * DEFAULT_DEADZONE_PERCENT));
                int adjHeight = (int) (view.getHeight() * (1 - 2 * DEFAULT_DEADZONE_PERCENT));

                int amountInPX = UiAutomatorHelper.convertDiptoPix(amountInDP);

                Log.d(LOG_TAG, "Amount in px: " + amountInPX);

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

                Log.d(LOG_TAG, "Scroll times: " + times + " rem: " + remainder + " full: " +fullAmount);

                for (int i = 0; i < times; ++i) {
                    doScroll(uiController, view, fullAmount);
                    uiController.loopMainThreadUntilIdle();
                }

                doScroll(uiController, view, remainder);
                uiController.loopMainThreadUntilIdle();
            }
        };
    }

    private static float[][] interpolate(float[] start, float[] end, int steps) {
        float[][] res = new float[steps][2];

        for (int i = 1; i < steps + 1; i++) {
            res[i - 1][0] = start[0] + (end[0] - start[0]) * i / (steps + 2f);
            res[i - 1][1] = start[1] + (end[1] - start[1]) * i / (steps + 2f);
        }

        return res;
    }

}
