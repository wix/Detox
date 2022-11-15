package com.wix.detox.espresso.action;

import android.view.View;

import androidx.test.espresso.UiController;
import androidx.test.espresso.ViewAction;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.wix.detox.espresso.DetoxMatcher;

import org.hamcrest.Matcher;

public class DetoxAccessibilityAction implements ViewAction {
    String mActionName;

    public DetoxAccessibilityAction(String actionName) {
        mActionName = actionName;
    }

    @Override
    public Matcher<View> getConstraints() {
        return DetoxMatcher.matcherForNotNull();
    }

    @Override
    public String getDescription() {
        return "Dispatch an Accessibility Action";
    }

    @Override
    public void perform(UiController uiController, View view) {
        ReactContext context = (ReactContext) view.getContext();
        final int reactTag = view.getId();
        final WritableMap event = Arguments.createMap();
        event.putString("actionName", mActionName);

        UIManagerModule uiManager = (UIManagerModule) UIManagerHelper.getUIManager(context, reactTag);
        uiManager.getEventDispatcher().dispatchEvent(new Event(reactTag) {
            @Override
            public String getEventName() {
                return "topAccessibilityAction";
            }

            @Override
            public void dispatch(RCTEventEmitter rctEventEmitter) {
                rctEventEmitter.receiveEvent(reactTag, "topAccessibilityAction", event);
            }
        });

        int waitTimeMS = 100;
        uiController.loopMainThreadForAtLeast(waitTimeMS);
    }
}