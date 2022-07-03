package com.wix.detox.espresso;

import com.wix.detox.espresso.action.DetoxTypeTextAction;
import com.wix.detox.espresso.action.RNClickAction;

import androidx.test.espresso.ViewAction;
import androidx.test.espresso.action.ViewActions;

import static androidx.test.espresso.action.ViewActions.actionWithAssertions;

/**
 * An alternative to {@link ViewActions} - providing alternative implementations, where needed.
 */
public class DetoxViewActions {
    public static DetoxViewAction click() {
        ViewAction viewAction = actionWithAssertions(new RNClickAction());
        return DetoxViewActionHelper.Companion.convertToDetoxViewAction(viewAction, false);
    }

    public static DetoxViewAction typeText(String text) {
        ViewAction viewAction = actionWithAssertions(new DetoxTypeTextAction(text));
        return DetoxViewActionHelper.Companion.convertToDetoxViewAction(viewAction, false);
    }
}
