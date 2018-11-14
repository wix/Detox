package com.wix.detox.espresso;

import android.support.test.espresso.UiController;
import android.support.test.espresso.ViewAction;
import android.support.test.espresso.action.ViewActions;
import android.view.View;

import com.wix.detox.ReactNativeSupport;

import org.hamcrest.Matcher;

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
