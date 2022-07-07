package com.wix.detox.espresso;

import android.view.View;

import com.wix.detox.common.DetoxErrors.DetoxRuntimeException;
import com.wix.detox.common.DetoxErrors.StaleActionException;

import junit.framework.AssertionFailedError;

import org.hamcrest.Matcher;

import androidx.test.espresso.ViewAction;
import androidx.test.espresso.ViewInteraction;

import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.assertion.ViewAssertions.doesNotExist;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static com.wix.detox.espresso.assertion.ViewAssertions.matches;
import static org.hamcrest.Matchers.not;

/**
 * Created by simonracz on 10/07/2017.
 */

public class DetoxAssertion {
    private DetoxAssertion() {
        // static class
    }

    public static ViewInteraction assertMatcher(DetoxViewInteraction interaction, Matcher<View> matcher) {
        return interaction.check(matches(matcher));
    }

    public static ViewInteraction assertNotVisible(DetoxViewInteraction interaction) {
        ViewInteraction result;
        try {
            result = interaction.check(doesNotExist());
        } catch (AssertionFailedError e) {
            result = interaction.check(matches(not(isDisplayed())));
        }

        return result;
    }

    public static ViewInteraction assertNotExists(DetoxViewInteraction interaction) {
        return interaction.check(doesNotExist());
    }

    public static void waitForAssertMatcher(final DetoxViewInteraction interaction, final Matcher<View> matcher, double timeoutSeconds) {
        final long originTime = System.nanoTime();

        while (true) {
            long currentTime = System.nanoTime();
            long elapsed = currentTime - originTime;
            double seconds = (double) elapsed / 1000000000.0;
            if (seconds >= timeoutSeconds) {
                throw new DetoxRuntimeException("" + timeoutSeconds + "sec timeout expired without matching of given matcher: " + matcher);
            }

            try {
                interaction.check(matches(matcher));
                break;
            } catch (AssertionFailedError err) {
                UiAutomatorHelper.espressoSync(20);
            }
        }
    }

    public static void waitForAssertMatcherWithSearchAction(
            final DetoxViewInteraction interaction,
            final Matcher<View> viewMatcher,
            final ViewAction searchAction,
            final Matcher<View> searchMatcher) {

        while (true) {
            try {
                assertMatcher(interaction, viewMatcher);
                break;
            } catch (AssertionFailedError err) {
                try {
                    onView(searchMatcher).perform(searchAction);
                } catch (StaleActionException exStaleAction) {
                    assertMatcher(interaction, viewMatcher);
                    break;
                }
            }
        }
    }
}
