package com.wix.detox.espresso;

import android.view.View;

import com.wix.detox.common.DetoxErrors;
import com.wix.detox.common.proxy.JournalInvocationHandler;

import org.hamcrest.core.IsAnything;
import org.joor.Reflect;

import androidx.test.espresso.Espresso;
import androidx.test.espresso.UiController;
import androidx.test.espresso.ViewInteraction;

public class UiControllerProxying {
    public static void tapIntoEventsInjectorStrategy() {
        try {
            final UiController uiController = getUiController();
            final /*EventInjector*/ Object eventInjector = Reflect.on(uiController).get("eventInjector");
            final /*EventInjectionStrategy*/ Object eventsInjectionStrategy = Reflect.on(eventInjector).get("injectionStrategy");
            final Object eventsInjectionStrategyProxy = JournalInvocationHandler.Companion.newInstance(eventsInjectionStrategy, UiControllerJournal.getUiControllerJournal());

            Reflect.on(eventInjector).set("injectionStrategy", eventsInjectionStrategyProxy);


        } catch (Exception e) {
            throw new DetoxErrors.DetoxRuntimeException(e);
        }
    }

    private static UiController getUiController() {
        ViewInteraction interaction = Espresso.onView(new IsAnything<View>());
        return Reflect.on(interaction).get("uiController");
    }
}
