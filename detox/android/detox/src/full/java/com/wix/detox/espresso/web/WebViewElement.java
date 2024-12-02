package com.wix.detox.espresso.web;

import android.os.Debug;
import android.view.View;
import android.webkit.WebView;

import androidx.test.espresso.web.model.Atom;
import androidx.test.espresso.web.model.ElementReference;
import androidx.test.espresso.web.sugar.Web;

import org.hamcrest.BaseMatcher;
import org.hamcrest.CoreMatchers;
import org.hamcrest.Description;
import org.hamcrest.Matcher;
import org.hamcrest.TypeSafeMatcher;

import java.util.List;

import javax.annotation.Nullable;

import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.web.sugar.Web.onWebView;
import static org.hamcrest.CoreMatchers.allOf;

public class WebViewElement {

    final Web.WebInteraction<Void> webViewInteraction;

    WebViewElement(@Nullable Matcher<View> userMatcher) {
        Matcher<View> matcher = null;

        if (userMatcher != null) {
            matcher = new TypeSafeMatcher<>() {

                @Override
                protected boolean matchesSafely(View item) {
                    // Support for react-native-webview >= 13.0.0
                    if (item instanceof WebView && item.getParent().getClass().getSimpleName().equals("RNCWebViewWrapper")) {
                        return userMatcher.matches(item.getParent());
                    }

                    return userMatcher.matches(item);
                }

                @Override
                public void describeTo(Description description) {
                    userMatcher.describeTo(description);
                }
            };
        }
        this.webViewInteraction = matcher != null ? onWebView(matcher) : onWebView();
    }

    public WebElement element(Atom<List<ElementReference>> webMatcher) {
        return element(webMatcher, 0);
    }

    public WebElement element(Atom<List<ElementReference>> webMatcher, int index) {
        return new WebElement(this, webMatcher, index);
    }
}
