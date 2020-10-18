package com.wix.detox.espresso.web;


import androidx.test.espresso.web.model.Atom;
import androidx.test.espresso.web.model.ElementReference;
import androidx.test.espresso.web.model.WindowReference;
import androidx.test.espresso.web.webdriver.Locator;

import static androidx.test.espresso.web.webdriver.DriverAtoms.findElement;
import static androidx.test.espresso.web.webdriver.DriverAtoms.selectActiveElement;
import static androidx.test.espresso.web.webdriver.DriverAtoms.selectFrameByIdOrName;
import static androidx.test.espresso.web.webdriver.DriverAtoms.selectFrameByIndex;

public class DetoxWebAtomMatcher {

    private DetoxWebAtomMatcher() {
        // static class
    }

    public static Atom<ElementReference> matcherForId(String id) {
        return findElement(Locator.ID, id);
    }

    public static Atom<ElementReference> matcherForClassName(String className) {
        return findElement(Locator.CLASS_NAME, className);
    }

    public static Atom<ElementReference> matcherForCssSelector(String cssSelector) {
        return findElement(Locator.CSS_SELECTOR, cssSelector);
    }

    public static Atom<ElementReference> matcherForName(String name) {
        return findElement(Locator.NAME, name);
    }

    public static Atom<ElementReference> matcherForXPath(String xpath) {
        return findElement(Locator.XPATH, xpath);
    }

    public static Atom<ElementReference> matcherForLinkText(String linkText) {
        return findElement(Locator.LINK_TEXT, linkText);
    }

    public static Atom<ElementReference> matcherForPartialLinkText(String partialLinkText) {
        return findElement(Locator.PARTIAL_LINK_TEXT, partialLinkText);
    }

    public static Atom<ElementReference> matcherForActiveElement() {
        return selectActiveElement();
    }

    public static Atom<WindowReference> matcherForFrameByIndex(int index) {
        return selectFrameByIndex(index);
    }

    public static Atom<WindowReference> matcherForFrameByIdOrName(String idOrName) {
        return selectFrameByIdOrName(idOrName);
    }
}
