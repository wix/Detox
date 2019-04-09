package com.wix.detox.espresso;

import android.view.View;

import com.wix.detox.ReactNativeSupport;

import org.hamcrest.Matcher;

import androidx.test.espresso.UiController;
import androidx.test.espresso.ViewAction;
import androidx.test.espresso.action.ViewActions;

/**
 * An alternative to {@link ViewActions} - providing alternative implementations, where needed.
 */
public class DetoxViewActions {
    private static class BusyViewActionWrapper implements ViewAction {
        private final ViewAction espressoViewAction;

        BusyViewActionWrapper(ViewAction clickAction) {
            this.espressoViewAction = clickAction;
        }

        @Override
        public Matcher<View> getConstraints() {
            return espressoViewAction.getConstraints();
        }

        @Override
        public String getDescription() {
            return espressoViewAction.getDescription();
        }

        @Override
        public void perform(UiController uiController, View view) {
            ReactNativeSupport.pauseRNTimersIdlingResource();
            espressoViewAction.perform(uiController, view);
            ReactNativeSupport.resumeRNTimersIdlingResource();
            uiController.loopMainThreadUntilIdle();
        }
    }

    public static ViewAction click() {
        final ViewAction clickAction = ViewActions.click();
        return new BusyViewActionWrapper(clickAction);
    }
}
