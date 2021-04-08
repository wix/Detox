package com.wix.detox.espresso.web;

import android.view.View;
import android.webkit.WebView;

import androidx.test.espresso.web.model.Atom;
import androidx.test.espresso.web.model.ElementReference;
import androidx.test.espresso.web.sugar.Web;

import org.hamcrest.CoreMatchers;
import org.hamcrest.Matcher;

import java.util.List;

import javax.annotation.Nullable;

import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.web.sugar.Web.onWebView;
import static org.hamcrest.CoreMatchers.allOf;

public class WebViewElement {

    final Matcher<View> matcher;
    final Web.WebInteraction<Void> webViewInteraction;

    WebViewElement(@Nullable Matcher<View> matcher) {
        this.matcher = matcher != null ? matcher : allOf(CoreMatchers.<View>instanceOf(WebView.class), isDisplayed());
        this.webViewInteraction = matcher != null ? onWebView(matcher) : onWebView();
    }

    public WebElement element(Atom<List<ElementReference>> webMatcher) {
        return element(webMatcher, 0);
    }

    public WebElement element(Atom<List<ElementReference>> webMatcher, int index) {
        return new WebElement(this, webMatcher, index);
    }
}
