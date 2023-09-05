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

    private static final double NANOSECONDS_IN_A_SECOND = 1_000_000_000.0;

    private DetoxAssertion() {
        // This is a utility class and shouldn't be instantiated.
    }

    /**
     * Asserts the given matcher for the provided view interaction.
     */
    public static ViewInteraction assertMatcher(ViewInteraction viewInteraction, Matcher<View> viewMatcher) {
        return viewInteraction.check(matches(viewMatcher));
    }

    /**
     * Asserts that the given view interaction is not visible.
     */
    public static ViewInteraction assertNotVisible(ViewInteraction viewInteraction) {
        ViewInteraction result;
        try {
            result = viewInteraction.check(doesNotExist());
            return result;
        } catch (AssertionFailedError e) {
            result = viewInteraction.check(matches(not(isDisplayed())));
            return result;
        }
    }

    /**
     * Asserts that the given view interaction does not exist.
     */
    public static ViewInteraction assertNotExists(ViewInteraction viewInteraction) {
        return viewInteraction.check(doesNotExist());
    }

    /**
     * Waits until the provided matcher matches the view interaction or a timeout occurs.
     */
    public static void waitForAssertMatcher(final ViewInteraction viewInteraction, final Matcher<View> viewMatcher, double timeoutSeconds) {
        final long startTime = System.nanoTime();

        while (true) {
            long currentTime = System.nanoTime();
            long elapsedTime = currentTime - startTime;
            double elapsedSeconds = (double) elapsedTime / NANOSECONDS_IN_A_SECOND;
            if (elapsedSeconds >= timeoutSeconds) {
                throw new DetoxRuntimeException(
                    "" + timeoutSeconds + "sec timeout expired without matching of given matcher: " + viewMatcher);
            }

            try {
                viewInteraction.check(matches(viewMatcher));
                break;
            } catch (AssertionFailedError err) {
                UiAutomatorHelper.espressoSync(20);
            }
        }
    }

    /**
     * Continually asserts the provided matcher until a search action returns a matching view or a
     * `StaleActionException` error is thrown.
     */
    public static void waitForAssertMatcherWithSearchAction(
        final ViewInteraction viewInteraction,
        final Matcher<View> viewMatcher,
        final ViewAction searchAction,
        final Matcher<View> searchMatcher
    ) {
        while (true) {
            try {
                assertMatcher(viewInteraction, viewMatcher);
                break;
            } catch (AssertionFailedError err) {
                try {
                    onView(searchMatcher).perform(searchAction);
                } catch (StaleActionException exStaleAction) {
                    assertMatcher(viewInteraction, viewMatcher);
                    break;
                }
            }
        }
    }
}
