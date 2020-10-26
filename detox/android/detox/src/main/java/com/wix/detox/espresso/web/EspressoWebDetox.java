package com.wix.detox.espresso.web;

import androidx.test.espresso.web.model.Atom;
import androidx.test.espresso.web.sugar.Web.WebInteraction;
import androidx.test.espresso.web.assertion.WebAssertion;

public class EspressoWebDetox {

    private EspressoWebDetox() {
        // static class
    }

    public static WebInteraction withElement(WebInteraction interaction, Atom elementAtom) {
        return interaction.withElement(elementAtom);
    }

    public static WebInteraction perform(WebInteraction interaction, Atom action) {
       return interaction.perform(action);
    }

    public static WebInteraction check(WebInteraction interaction, WebAssertion webAssertion) {
        return interaction.check(webAssertion);
    }

}