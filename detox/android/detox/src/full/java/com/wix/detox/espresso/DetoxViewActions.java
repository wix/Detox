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
    public static ViewAction click() {
        return actionWithAssertions(new RNClickAction());
    }

    public static ViewAction typeText(String text) {
        return actionWithAssertions(new DetoxTypeTextAction(text));
    }
}
