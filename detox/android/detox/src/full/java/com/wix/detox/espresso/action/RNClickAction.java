package com.wix.detox.espresso.action;

import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;

import com.wix.detox.reactnative.ReactNativeExtension;

import org.hamcrest.Matcher;

import androidx.test.espresso.UiController;
import androidx.test.espresso.ViewAction;
import androidx.test.espresso.action.CoordinatesProvider;
import androidx.test.espresso.action.GeneralClickAction;
import androidx.test.espresso.action.GeneralLocation;
import androidx.test.espresso.action.Press;

import static androidx.test.espresso.matcher.ViewMatchers.isDisplayingAtLeast;

public class RNClickAction implements ViewAction {
    private final GeneralClickAction clickAction;

    public RNClickAction() {
        this(null, null);
    }

    public RNClickAction(CoordinatesProvider coordinatesProvider) {
        this(coordinatesProvider, null);
    }

    public RNClickAction(CoordinatesProvider coordinatesProvider, Long duration) {
        coordinatesProvider = coordinatesProvider != null ? coordinatesProvider : GeneralLocation.VISIBLE_CENTER;

        clickAction = new GeneralClickAction(
            new DetoxSingleTap(duration),
            coordinatesProvider,
            Press.FINGER,
            InputDevice.SOURCE_UNKNOWN,
            MotionEvent.BUTTON_PRIMARY
        );
    }

    @Override
    public Matcher<View> getConstraints() {
        return isDisplayingAtLeast(75);
    }

    @Override
    public String getDescription() {
        return clickAction.getDescription();
    }

    @Override
    public void perform(UiController uiController, View view) {
        ReactNativeExtension.toggleTimersSynchronization(false);
        try {
            clickAction.perform(uiController, view);
        } finally {
            ReactNativeExtension.toggleTimersSynchronization(true);
        }
        uiController.loopMainThreadUntilIdle();
    }
}
