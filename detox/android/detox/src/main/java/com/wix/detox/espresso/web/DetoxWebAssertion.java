package com.wix.detox.espresso.web;


import androidx.test.espresso.matcher.ViewMatchers;
import androidx.test.espresso.web.assertion.WebAssertion;
import androidx.test.espresso.web.model.Atom;
import androidx.test.espresso.web.webdriver.DriverAtoms;

import org.hamcrest.Matchers;

import static androidx.test.espresso.web.assertion.WebViewAssertions.webMatches;

public class DetoxWebAssertion {

    private DetoxWebAssertion() {
        // static class
    }

    public static WebAssertion<String> assertHasText(Atom atom, String text) {
        return webMatches(atom, ViewMatchers.isDisplayed());
    }


}
