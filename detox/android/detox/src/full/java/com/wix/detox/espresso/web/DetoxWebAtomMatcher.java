package com.wix.detox.espresso.web;


import static androidx.test.espresso.web.webdriver.DriverAtoms.findMultipleElements;

import static com.wix.detox.espresso.web.DetoxDriverAtoms.findMultipleElementsDetox;

import androidx.test.espresso.web.model.Atom;
import androidx.test.espresso.web.model.ElementReference;
import androidx.test.espresso.web.webdriver.Locator;

import java.util.List;


public class DetoxWebAtomMatcher {

    private DetoxWebAtomMatcher() {
        // static class
    }

    public static Atom<List<ElementReference>> matcherForId(String id) {
        return findMultipleElementsDetox(Locator.ID, id);
    }

    public static Atom<List<ElementReference>> matcherForClassName(String className) {
        return findMultipleElementsDetox(Locator.CLASS_NAME, className);
    }

    public static Atom<List<ElementReference>> matcherForCssSelector(String cssSelector) {
        return findMultipleElementsDetox(Locator.CSS_SELECTOR, cssSelector);
    }

    public static Atom<List<ElementReference>> matcherForName(String name) {
        return findMultipleElementsDetox(Locator.NAME, name);
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
