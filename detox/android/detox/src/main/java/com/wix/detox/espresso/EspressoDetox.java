package com.wix.detox.espresso;

import android.support.test.espresso.ViewAction;
import android.support.test.espresso.ViewInteraction;

/**
 * Created by rotemm on 26/12/2016.
 */

public class EspressoDetox {
    private static final String LOG_TAG = "detox";

    public static ViewInteraction perform(ViewInteraction interaction, ViewAction action) {
        return interaction.perform(action);
    }
}

