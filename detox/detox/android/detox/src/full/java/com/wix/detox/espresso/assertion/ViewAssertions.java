package com.wix.detox.espresso.assertion;

import androidx.annotation.NonNull;
import android.view.View;

import org.hamcrest.Matcher;
import org.hamcrest.StringDescription;

import androidx.test.espresso.NoMatchingViewException;
import androidx.test.espresso.ViewAssertion;

import static androidx.test.espresso.core.internal.deps.guava.base.Preconditions.checkNotNull;
import static androidx.test.espresso.matcher.ViewMatchers.assertThat;

/**
 * A custom extension of {@link androidx.test.espresso.assertion.ViewAssertions}.
 *
 * <p/>Perhaps in the future we could extend Espresso's using Kotlin's extension functions.
 */
public class ViewAssertions {

    /**
     * An alternative to Espresso's {@link androidx.test.espresso.assertion.ViewAssertions#matches(Matcher)},
     * which is more suitable for Detox' separated interaction-matcher architecture.
     * See {@link MatchesViewAssertion} for more details.
     */
    public static ViewAssertion matches(final Matcher<? super View> viewMatcher) {
        return new MatchesViewAssertion(checkNotNull(viewMatcher));
    }

    /**
     * Identical to Espresso's {@link androidx.test.espresso.assertion.ViewAssertions}#MatchesViewAssertion
     * typically created by {@link androidx.test.espresso.assertion.ViewAssertions#matches(Matcher)}, except
     * that instead of throwing the {@link NoMatchingViewException} (given to the matcher by the <b>interaction</b>
     * when the view wasn't in the hierarchy), it invokes the matcher nonetheless (i.e. with a <i>null</i> as the item).
     */
    private static class MatchesViewAssertion implements ViewAssertion {
        final Matcher<? super View> viewMatcher;

        private MatchesViewAssertion(final Matcher<? super View> viewMatcher) {
            this.viewMatcher = viewMatcher;
        }

        @Override
        public void check(View view, NoMatchingViewException noViewException) {
            StringDescription description = new StringDescription();
            description.appendText("'");
            viewMatcher.describeTo(description);

            description.appendText("' doesn't match the selected view.");

            assertThat(description.toString(), noViewException != null ? null : view, viewMatcher);
        }

        @NonNull
        @Override
        public String toString() {
            return String.format("MatchesViewAssertion(Detox){viewMatcher=%s}", viewMatcher);
        }
    }
}
