package com.wix.detox.espresso;

import android.support.test.InstrumentationRegistry;
import android.support.test.espresso.Espresso;
import android.support.test.espresso.UiController;
import android.support.test.espresso.ViewAction;
import android.support.test.espresso.ViewInteraction;
import android.view.View;

import org.hamcrest.Matcher;
import org.hamcrest.core.IsAnything;

import static android.support.test.espresso.matcher.ViewMatchers.isAssignableFrom;
import static org.hamcrest.Matchers.anyOf;


/**
 * Created by simonracz on 10/07/2017.
 */

public class DetoxAction {

    private DetoxAction() {
        // static class
    }

}
