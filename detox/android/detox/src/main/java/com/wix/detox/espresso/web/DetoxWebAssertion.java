package com.wix.detox.espresso.web;


import androidx.test.espresso.web.sugar.Web.WebInteraction;
import androidx.test.espresso.web.webdriver.DriverAtoms;

import org.hamcrest.Matchers;

import static androidx.test.espresso.web.assertion.WebViewAssertions.webMatches;

public class DetoxWebAssertion {

    private DetoxWebAssertion() {
        // static class
    }

    public static WebInteraction<String> assertHasText(WebInteraction webInteraction, String text) {
        return webInteraction.check(webMatches(DriverAtoms.getText(), Matchers.containsString(text)));
    }
}
