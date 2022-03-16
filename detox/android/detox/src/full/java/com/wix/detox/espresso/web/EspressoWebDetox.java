package com.wix.detox.espresso.web;

import android.view.View;

import org.hamcrest.Matcher;

import javax.annotation.Nullable;

public class EspressoWebDetox {

    private static final String TAG = "EspressoWebDetox";

    private EspressoWebDetox() {
        // static class
    }

    /**
     * Gets the one and only visible webview on the screen.
     * If there are multiple webview, you should use {@code getWebView(@Nullable Matcher<View> matcher)}.
     * @return {@link WebViewElement}
     */
    public static WebViewElement getWebView() {
        return getWebView(null);
    }

    /**
     * Get the webview matches the provided {@param matcher}
     * @param matcher a webview mathcer representation
     * @return {@link WebViewElement}
     */
    public static WebViewElement getWebView(@Nullable Matcher<View> matcher) {
        return new WebViewElement(matcher);
    }

    /**
     * @param webElement
     * @return {@link WebExpect}
     */
    public static WebExpect expect(WebElement webElement) {
        return new WebExpect(webElement);
    }
}
