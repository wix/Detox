package com.wix.detox.espresso.web;

import android.view.View;

import androidx.test.espresso.web.model.Atom;
import androidx.test.espresso.web.model.ElementReference;
import androidx.test.espresso.web.sugar.Web;

import org.hamcrest.Matcher;

import java.util.List;

import javax.annotation.Nullable;

import static androidx.test.espresso.web.sugar.Web.onWebView;

public class WebViewElement {

    final Web.WebInteraction<Void> webViewInteraction;

    WebViewElement(@Nullable Matcher<View> matcher) {
        this.webViewInteraction = matcher != null ? onWebView(matcher) : onWebView();
    }

    public WebElement element(Atom<List<ElementReference>> matcher) {
        return element(matcher, 0);
    }

    public WebElement element(Atom<List<ElementReference>> matcher, int index) {
        return new WebElement(webViewInteraction, matcher, index);
    }
}
