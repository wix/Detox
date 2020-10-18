package com.wix.detox.espresso.web;

import androidx.test.espresso.web.model.Atom;
import androidx.test.espresso.web.sugar.Web.WebInteraction;

public class EspressoWebDetox {
    private static final String LOG_TAG = "detox_web";

    private EspressoWebDetox() {
        // static class
    }

    public static WebInteraction perform(WebInteraction interaction, Atom action) {
       return interaction.perform(action);
    }

}