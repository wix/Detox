package com.wix.detox.espresso;

import android.view.View;

import com.wix.detox.espresso.DetoxErrors.DetoxRuntimeException;
import com.wix.detox.espresso.DetoxErrors.StaleActionException;

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

    public static ViewInteraction assertMatcher(ViewInteraction i, Matcher<View> m) {
        return i.check(matches(m));
    }

    public static ViewInteraction assertNotVisible(ViewInteraction i) {
        ViewInteraction ret;
        try {
            ret = i.check(doesNotExist());
            return ret;
        } catch (AssertionFailedError e) {
            ret = i.check(matches(not(isDisplayed())));
            return ret;
        }
    }

    public static ViewInteraction assertNotExists(ViewInteraction i) {
        return i.check(doesNotExist());
    }

    public static void waitForAssertMatcher(final ViewInteraction i, final Matcher<View> m, double timeoutSeconds) {
        final long originTime = System.nanoTime();

        while (true) {
            long currentTime = System.nanoTime();
            long elapsed = currentTime - originTime;
            double seconds = (double) elapsed / 1000000000.0;
            if (seconds >= timeoutSeconds) {
                throw new DetoxRuntimeException("" + timeoutSeconds + "sec timeout expired without matching of given matcher: " + m);
            }

            try {
                i.check(matches(m));
                break;
            } catch (AssertionFailedError err) {
                UiAutomatorHelper.espressoSync(20);
            }
        }
    }

    public static void waitForAssertMatcherWithSearchAction(
            final ViewInteraction i,
            final Matcher<View> vm,
            final ViewAction searchAction,
            final Matcher<View> searchMatcher) {

        while (true) {
            try {
                assertMatcher(i, vm);
                break;
            } catch (AssertionFailedError err) {
                try {
                    onView(searchMatcher).perform(searchAction);
                } catch (StaleActionException exStaleAction) {
                    assertMatcher(i, vm);
                    break;
                }
            }
        }
    }
}
