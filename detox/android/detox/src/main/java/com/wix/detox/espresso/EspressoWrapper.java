package com.wix.detox.espresso;

import com.wix.invoke.MethodInvocation;
import com.wix.invoke.types.ClassTarget;
import com.wix.invoke.types.Invocation;

import static android.support.test.espresso.Espresso.onView;
import static android.support.test.espresso.action.ViewActions.click;
import static android.support.test.espresso.matcher.ViewMatchers.withId;


/**
 * Created by rotemm on 26/12/2016.
 */

public class EspressoWrapper {

    public static void wrap() {
        onView(withId(buttonId)).perform(click());
        MethodInvocation.invoke(new Invocation(new ClassTarget("java.lang.String"), "valueOf", 1.0f));
    }
}
