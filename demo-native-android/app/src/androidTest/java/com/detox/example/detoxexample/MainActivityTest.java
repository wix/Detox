package com.detox.example.detoxexample;


import android.support.test.rule.ActivityTestRule;
import android.support.test.runner.AndroidJUnit4;
import android.test.suitebuilder.annotation.LargeTest;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import static android.support.test.espresso.Espresso.onView;
import static android.support.test.espresso.action.ViewActions.click;
import static android.support.test.espresso.assertion.ViewAssertions.matches;
import static android.support.test.espresso.matcher.ViewMatchers.withId;
import static android.support.test.espresso.matcher.ViewMatchers.withText;

@LargeTest
@RunWith(AndroidJUnit4.class)
public class MainActivityTest {

    @Rule
    public ActivityTestRule<MainActivity> mActivityTestRule = new ActivityTestRule<>(MainActivity.class);

    @Test
    public void helloButtonSaysHello() {
        clickAndCheck(R.id.helloButton, "Hello!!!");
    }

    @Test
    public void worldButtonSaysWorld() {
        clickAndCheck(R.id.worldButton, "World!!!");
    }

    private void clickAndCheck(int buttonId, String text) {
        onView(withId(buttonId)).perform(click());
        onView(withId(R.id.textView)).check(matches(withText(text)));
    }
}
