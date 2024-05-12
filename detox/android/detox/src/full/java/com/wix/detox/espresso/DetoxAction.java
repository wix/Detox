package com.wix.detox.espresso;

import static androidx.test.espresso.action.ViewActions.actionWithAssertions;
import static androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static org.hamcrest.Matchers.allOf;

import android.view.View;

import androidx.test.espresso.UiController;
import androidx.test.espresso.ViewAction;
import androidx.test.espresso.ViewInteraction;
import androidx.test.espresso.action.CoordinatesProvider;
import androidx.test.espresso.action.GeneralClickAction;
import androidx.test.espresso.action.GeneralLocation;
import androidx.test.espresso.action.Press;
import androidx.test.espresso.contrib.PickerActions;

import com.wix.detox.action.common.MotionDir;
import com.wix.detox.common.DetoxErrors.DetoxRuntimeException;
import com.wix.detox.common.DetoxErrors.StaleActionException;
import com.wix.detox.espresso.action.AdjustSliderToPositionAction;
import com.wix.detox.espresso.action.DetoxCustomTapper;
import com.wix.detox.espresso.action.GetAttributesAction;
import com.wix.detox.espresso.action.LongPressAndDragAction;
import com.wix.detox.espresso.action.RNClickAction;
import com.wix.detox.espresso.action.RNDetoxAccessibilityAction;
import com.wix.detox.espresso.action.ScreenshotResult;
import com.wix.detox.espresso.action.ScrollToIndexAction;
import com.wix.detox.espresso.action.TakeViewScreenshotAction;
import com.wix.detox.espresso.action.common.utils.ViewInteractionExt;
import com.wix.detox.espresso.action.common.DetoxViewConfigurations;
import com.wix.detox.espresso.scroll.DetoxScrollAction;
import com.wix.detox.espresso.scroll.DetoxScrollActionStaleAtEdge;
import com.wix.detox.espresso.scroll.ScrollEdgeException;
import com.wix.detox.espresso.scroll.ScrollHelper;
import com.wix.detox.espresso.scroll.SwipeHelper;

import org.hamcrest.Matcher;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

/**
 * Created by simonracz on 10/07/2017.
 */

public class DetoxAction {
    private static final String LOG_TAG = "detox";
    private static final String ISO8601_FORMAT = "yyyy-MM-dd'T'HH:mm:ssZ";
    private static final String ISO8601_FORMAT_NO_TZ = "yyyy-MM-dd'T'HH:mm:ss";

    private DetoxAction() {
        // static class
    }

    public static ViewAction multiClick(int times) {
        return actionWithAssertions(new GeneralClickAction(new DetoxCustomTapper(times), GeneralLocation.CENTER, Press.FINGER, 0, 0));
    }

    public static ViewAction tapAtLocation(final int x, final int y) {
        CoordinatesProvider coordinatesProvider = createCoordinatesProvider(x, y);
        return actionWithAssertions(new RNClickAction(coordinatesProvider));
    }

    private static CoordinatesProvider createCoordinatesProvider(final int x, final int y) {
        final int px = DeviceDisplay.convertDpiToPx(x);
        final int py = DeviceDisplay.convertDpiToPx(y);

        return new CoordinatesProvider() {
             @Override
             public float[] calculateCoordinates(View view) {
                 final int[] xy = new int[2];
                 view.getLocationOnScreen(xy);
                 final float fx = xy[0] + px;
                 final float fy = xy[1] + py;
                 return new float[]{fx, fy};
             }
         };
     };

    /**
     * Scrolls to the edge of the given scrollable view.
     *
     * @param edge                Direction to scroll (see {@link MotionDir})
     * @param startOffsetPercentX Percentage denoting where the scroll should start from on the X-axis, with respect to the scrollable view.
     * @param startOffsetPercentY Percentage denoting where the scroll should start from on the Y-axis, with respect to the scrollable view.
     * @return ViewAction
     */
    public static ViewAction scrollToEdge(final int edge, double startOffsetPercentX, double startOffsetPercentY) {
        final Float _startOffsetPercentX = startOffsetPercentX < 0 ? null : (float) startOffsetPercentX;
        final Float _startOffsetPercentY = startOffsetPercentY < 0 ? null : (float) startOffsetPercentY;

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
                        ScrollHelper.performOnce(uiController, view, edge, _startOffsetPercentX, _startOffsetPercentY);
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
     * @param direction           Direction to scroll (see {@link MotionDir})
     * @param amountInDP          Density Independent Pixels
     * @param startOffsetPercentX Percentage denoting where the scroll should start from on the X-axis, with respect to the scrollable view.
     * @param startOffsetPercentY Percentage denoting where the scroll should start from on the Y-axis, with respect to the scrollable view.
     */
    public static ViewAction scrollInDirection(final int direction, final double amountInDP, double startOffsetPercentX, double startOffsetPercentY) {
        final Float _startOffsetPercentX = startOffsetPercentX < 0 ? null : (float) startOffsetPercentX;
        final Float _startOffsetPercentY = startOffsetPercentY < 0 ? null : (float) startOffsetPercentY;
        return actionWithAssertions(new DetoxScrollAction(direction, amountInDP, _startOffsetPercentX, _startOffsetPercentY));
    }

    /**
     * Scroll the view in a direction by a specified amount (DP units).
     * <br/>Similar to {@link #scrollInDirection(int, double, double, double)}, but stops <b>gracefully</b> in the case
     * where the scrolling-edge is reached, by throwing the {@link StaleActionException} exception (i.e.
     * so as to make this use case manageable by the user).
     *
     * @param direction           Direction to scroll (see {@link MotionDir})
     * @param amountInDP          Density Independent Pixels
     * @param startOffsetPercentX Percentage denoting where the scroll should start from on the X-axis, with respect to the scrollable view.
     * @param startOffsetPercentY Percentage denoting where the scroll should start from on the Y-axis, with respect to the scrollable view.
     */
    public static ViewAction scrollInDirectionStaleAtEdge(final int direction, final double amountInDP, double startOffsetPercentX, double startOffsetPercentY) {
        final Float _startOffsetPercentX = startOffsetPercentX < 0 ? null : (float) startOffsetPercentX;
        final Float _startOffsetPercentY = startOffsetPercentY < 0 ? null : (float) startOffsetPercentY;
        return actionWithAssertions(new DetoxScrollActionStaleAtEdge(direction, amountInDP, _startOffsetPercentX, _startOffsetPercentY));
    }

    /**
     * Swipes the View in a direction.
     *
     * @param direction                Direction to swipe (see {@link MotionDir})
     * @param fast                     true if fast, false if slow
     * @param normalizedOffset         or "swipe amount" between 0.0 and 1.0, relative to the screen width/height
     * @param normalizedStartingPointX X coordinate of swipe starting point (between 0.0 and 1.0), relative to the view width
     * @param normalizedStartingPointY Y coordinate of swipe starting point (between 0.0 and 1.0), relative to the view height
     */
    public static ViewAction swipeInDirection(final int direction, boolean fast, double normalizedOffset, double normalizedStartingPointX, double normalizedStartingPointY) {
        SwipeHelper swipeHelper = SwipeHelper.getDefault();
        return swipeHelper.swipeInDirection(direction, fast, normalizedOffset, normalizedStartingPointX, normalizedStartingPointY);
    }

    public static ViewAction getAttributes() {
        return new GetAttributesAction();
    }

    public static ViewAction scrollToIndex(int index) {
        return new ScrollToIndexAction(index);
    }

    public static ViewAction setDatePickerDate(String dateString, String formatString) throws ParseException {
        Date date;
        if (formatString.equals("ISO8601")) {
            date = parseDateISO8601(dateString);
        } else {
            date = new SimpleDateFormat(formatString).parse(dateString);
        }

        Calendar cal = Calendar.getInstance();
        cal.setTime(date);
        return PickerActions.setDate(cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1, cal.get(Calendar.DAY_OF_MONTH));
    }

    public static ViewAction adjustSliderToPosition(final Float newPosition) {
        return new AdjustSliderToPositionAction(newPosition);
    }

    public static ViewAction longPressAndDrag(Integer duration,
                                              Double normalizedPositionX,
                                              Double normalizedPositionY,
                                              ViewInteraction targetElement,
                                              Double normalizedTargetPositionX,
                                              Double normalizedTargetPositionY,
                                              boolean isFast,
                                              Integer holdDuration) {

        // We receive a ViewInteraction which represents an interactions of the target view. We need to extract the view
        // from it in order to get the coordinates of the target view.
        View targetView = ViewInteractionExt.getView(targetElement);

        return actionWithAssertions(new LongPressAndDragAction(
            duration,
            normalizedPositionX,
            normalizedPositionY,
            targetView,
            normalizedTargetPositionX,
            normalizedTargetPositionY,
            isFast,
            holdDuration
        ));
    }

    public static ViewAction longPress() {
        return longPress(null, null, null);
    }

    public static ViewAction longPress(Integer duration) {
        return longPress(null, null, duration);
    }

    public static ViewAction longPress(Integer x, Integer y) {
        return longPress(x, y, null);
    }

    public static ViewAction longPress(Integer x, Integer y, Integer duration) {
        Long finalDuration = duration != null ? duration : DetoxViewConfigurations.getLongPressTimeout();
        CoordinatesProvider coordinatesProvider = x == null || y == null ? null : createCoordinatesProvider(x, y);

        return actionWithAssertions(new RNClickAction(coordinatesProvider, finalDuration));
    }

    public static ViewAction takeViewScreenshot() {
        return new ViewActionWithResult<String>() {
            private final TakeViewScreenshotAction action = new TakeViewScreenshotAction();

            @Override
            public Matcher<View> getConstraints() {
                return action.getConstraints();
            }

            @Override
            public String getDescription() {
                return action.getDescription();
            }

            @Override
            public void perform(UiController uiController, View view) {
                action.perform(uiController, view);
            }

            @Override
            public String getResult() {
                ScreenshotResult result = action.getResult();
                return (result == null ? null : result.asBase64String());
            }
        };
    }

    public static ViewAction accessibilityAction(final String actionName) {
        return new RNDetoxAccessibilityAction(actionName);
    }

    private static Date parseDateISO8601(String dateString) throws ParseException {
        try {
            return new SimpleDateFormat(ISO8601_FORMAT).parse(dateString);
        } catch (ParseException e) {
            return new SimpleDateFormat(ISO8601_FORMAT_NO_TZ).parse(dateString);
        }
    }
}
