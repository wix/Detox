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

    final Web.WebInteraction<Void> webViewInteraction;
    final Atom<List<ElementReference>> matcherAtom;
    final int index;

    WebElement(Web.WebInteraction<Void> webViewInteraction, Atom<List<ElementReference>> matcherAtom, int index) {
        this.webViewInteraction = webViewInteraction;
        this.matcherAtom = matcherAtom;
        this.index = index;
    }

    ElementReference get() {
        List<ElementReference> elements = webViewInteraction.perform(matcherAtom).get();

        if (elements == null || elements.size() == 0 || index >= elements.size()) {
            throw new RuntimeException("element not found");
        }

        return elements.get(index);
    }

    public void tap() {
        webViewInteraction.withElement(get()).perform(DriverAtoms.webClick());
    }

    public void replaceText(String text) {
        clearText();
        webViewInteraction.withElement(get()).perform(DriverAtoms.webKeys(text));
    }

    public void clearText() {
        webViewInteraction.withElement(get()).perform(DriverAtoms.clearElement());
    }

    public boolean scrollToView() {
        return webViewInteraction.withElement(get()).perform(DriverAtoms.webScrollIntoView()).get();
    }

    public String getText() {
        return webViewInteraction.withElement(get()).perform(DriverAtoms.getText()).get();
    }

    public Evaluation runScript(String script) {
        return webViewInteraction.withElement(get()).perform(new SimpleAtom(script)).get();
    }

    public Evaluation runScriptWithArgs(String script, final ArrayList<Object> args) {
        return webViewInteraction.withElement(get()).perform(Atoms.scriptWithArgs(script, args)).get();
    }

    public String getCurrentUrl() {
        return webViewInteraction.withElement(get()).perform(Atoms.getCurrentUrl()).get();
    }

    public String getTitle() {
        return webViewInteraction.withElement(get()).perform(Atoms.getTitle()).get();
    }
}
