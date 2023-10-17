package com.wix.detox.espresso.web;

import androidx.test.espresso.web.model.Atom;
import androidx.test.espresso.web.model.Atoms;
import androidx.test.espresso.web.model.ElementReference;
import androidx.test.espresso.web.model.Evaluation;
import androidx.test.espresso.web.model.SimpleAtom;
import androidx.test.espresso.web.sugar.Web;
import androidx.test.espresso.web.webdriver.DriverAtoms;

import java.util.ArrayList;
import java.util.List;

public class WebElement {

    final WebViewElement webViewElement;
    final Atom<List<ElementReference>> matcherAtom;
    final int index;

    WebElement(WebViewElement webViewElement, Atom<List<ElementReference>> matcherAtom, int index) {
        this.webViewElement = webViewElement;
        this.matcherAtom = matcherAtom;
        this.index = index;
    }

    Web.WebInteraction<Void> getWebViewInteraction() {
        return webViewElement.webViewInteraction;
    }

    ElementReference get() {
        List<ElementReference> elements = getWebViewInteraction().perform(matcherAtom).get();

        if (elements == null || elements.size() == 0 || index >= elements.size()) {
            throw new RuntimeException(String.format("element was not found at index: %d", index));
        }

        return elements.get(index);
    }

    public void tap() {
        getWebViewInteraction().withElement(get()).perform(DriverAtoms.webClick());
    }

    public void typeText(String text) {
        getWebViewInteraction().withElement(get()).perform(DriverAtoms.webKeys(text));
    }

    public void replaceText(String text) {
        clearText();
        getWebViewInteraction().withElement(get()).perform(DriverAtoms.webKeys(text));
    }

    public void clearText() {
        getWebViewInteraction().withElement(get()).perform(DriverAtoms.clearElement());
    }

    public boolean scrollToView() {
        return getWebViewInteraction().withElement(get()).perform(DriverAtoms.webScrollIntoView()).get();
    }

    public String getText() {
        return getWebViewInteraction().withElement(get()).perform(DriverAtoms.getText()).get();
    }

    public Object runScript(String script) {
        return getWebViewInteraction().withElement(get()).perform(new SimpleAtom(script)).get().getValue();
    }

    public Object runScriptWithArgs(String script, final ArrayList<Object> args) {
        return getWebViewInteraction().withElement(get()).perform(Atoms.scriptWithArgs(script, args)).get().getValue();
    }

    public String getCurrentUrl() {
        return getWebViewInteraction().withElement(get()).perform(Atoms.getCurrentUrl()).get();
    }

    public String getTitle() {
        return getWebViewInteraction().withElement(get()).perform(Atoms.getTitle()).get();
    }
}
