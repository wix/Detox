package com.wix.detox.espresso.web;


import androidx.test.espresso.web.model.Atom;
import androidx.test.espresso.web.model.ElementReference;
import androidx.test.espresso.web.webdriver.Locator;

import java.util.List;

import static androidx.test.espresso.web.webdriver.DriverAtoms.findMultipleElements;

public class DetoxWebAtomMatcher {

    private DetoxWebAtomMatcher() {
        // static class
    }

    public static Atom<List<ElementReference>> matcherForId(String id) {
        return findMultipleElements(Locator.ID, id);
    }

    public static Atom<List<ElementReference>> matcherForClassName(String className) {
        return findMultipleElements(Locator.CLASS_NAME, className);
    }

    public static Atom<List<ElementReference>> matcherForCssSelector(String cssSelector) {
        return findMultipleElements(Locator.CSS_SELECTOR, cssSelector);
    }

    public static Atom<List<ElementReference>> matcherForName(String name) {
        return findMultipleElements(Locator.NAME, name);
    }

    public static Atom<List<ElementReference>> matcherForXPath(String xpath) {
        return findMultipleElements(Locator.XPATH, xpath);
    }

    public static Atom<List<ElementReference>> matcherForLinkText(String linkText) {
        return findMultipleElements(Locator.LINK_TEXT, linkText);
    }

    public static Atom<List<ElementReference>> matcherForPartialLinkText(String partialLinkText) {
        return findMultipleElements(Locator.PARTIAL_LINK_TEXT, partialLinkText);
    }

    public static Atom<List<ElementReference>> matcherForTagName(String tag) {
        return findMultipleElements(Locator.TAG_NAME, tag);
    }
}