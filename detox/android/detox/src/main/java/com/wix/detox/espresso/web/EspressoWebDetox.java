package com.wix.detox.espresso.web;

import android.view.View;

import org.hamcrest.Matcher;

import javax.annotation.Nullable;

public class EspressoWebDetox {

    private static final String TAG = "EspressoWebDetox";

    private EspressoWebDetox() {
        // static class
    }

    public static WebViewElement getWebView() {
        return getWebView(null);
    }

    public static WebViewElement getWebView(@Nullable Matcher<View> matcher) {
        return new WebViewElement(matcher);
    }

    public static WebExpect expect(WebElement webElement) {
        return new WebExpect(webElement);
    }
}