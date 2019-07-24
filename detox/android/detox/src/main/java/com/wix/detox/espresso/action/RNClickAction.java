package com.wix.detox.espresso.action;

import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;

import com.wix.detox.ReactNativeSupport;

import org.hamcrest.Matcher;

import androidx.test.espresso.UiController;
import androidx.test.espresso.ViewAction;
import androidx.test.espresso.action.GeneralClickAction;
import androidx.test.espresso.action.GeneralLocation;
import androidx.test.espresso.action.Press;
import androidx.test.espresso.action.Tap;

public class RNClickAction implements ViewAction {
    private final ViewAction clickAction =
            new GeneralClickAction(
                Tap.SINGLE,
                GeneralLocation.VISIBLE_CENTER,
                Press.FINGER,
                InputDevice.SOURCE_UNKNOWN,
                MotionEvent.BUTTON_PRIMARY);

    @Override
    public Matcher<View> getConstraints() {
        return clickAction.getConstraints();
    }

    @Override
    public String getDescription() {
        return clickAction.getDescription();
    }

    @Override
    public void perform(UiController uiController, View view) {
        ReactNativeSupport.pauseRNTimersIdlingResource();
        try {
            clickAction.perform(uiController, view);
        } finally {
            ReactNativeSupport.resumeRNTimersIdlingResource();
        }
        uiController.loopMainThreadUntilIdle();
    }
}
