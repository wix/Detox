package com.detox.example.detoxexample;


import android.support.test.espresso.action.ViewActions;
import android.support.test.rule.ActivityTestRule;
import android.support.test.runner.AndroidJUnit4;
import android.test.suitebuilder.annotation.LargeTest;

import com.wix.detox.WebSocketClient;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.HashMap;

import static android.support.test.espresso.Espresso.onView;
import static android.support.test.espresso.assertion.ViewAssertions.matches;
import static android.support.test.espresso.matcher.ViewMatchers.isDisplayed;
import static android.support.test.espresso.matcher.ViewMatchers.withId;

@LargeTest
@RunWith(AndroidJUnit4.class)
public class MainActivityTest2 {

    @Rule
    public ActivityTestRule<MainActivity> mActivityTestRule = new ActivityTestRule<>(MainActivity.class);

    @Test
    public void mainActivityTest2() {

        WebSocketClient client = new WebSocketClient();
        client.connectToServer("test");
        HashMap params = new HashMap();
        params.put("sessionId", "test");
        params.put("role", "testee");
        client.sendAction("login", params, new WebSocketClient.ActionHandler() {
            @Override
            public void onAction() {
                onView(withId(R.id.helloButton)).perform(ViewActions.click()).check(matches(isDisplayed()));
            }
        });
    }

}
