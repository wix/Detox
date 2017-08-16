package com.wix.detox.espresso;

import android.app.Activity;
import android.content.Context;
import android.content.ContextWrapper;
import android.content.pm.ActivityInfo;
import android.support.test.espresso.UiController;
import android.support.test.espresso.ViewAction;
import android.support.test.espresso.ViewInteraction;
import android.util.Log;
import android.view.View;

import org.hamcrest.Matcher;

import static android.support.test.espresso.Espresso.onView;
import static android.support.test.espresso.matcher.ViewMatchers.isRoot;

/**
 * Created by rotemm on 26/12/2016.
 */

public class EspressoDetox {
    private static final String LOG_TAG = "detox";

    public static ViewInteraction perform(ViewInteraction interaction, ViewAction action) {
        return interaction.perform(action);
    }

    public static Activity getActivity(Context context) {
        while (context instanceof ContextWrapper) {
            if (context instanceof Activity) {
                return (Activity)context;
            }
            context = ((ContextWrapper)context).getBaseContext();
        }
        return null;
    }

    public static void changeOrientation(final int orientation) {
        onView(isRoot()).perform(new ViewAction() {
            @Override
            public Matcher<View> getConstraints() {
                return isRoot();
            }

            @Override
            public String getDescription() {
                return "changing orientation to " + orientation;
            }

            @Override
            public void perform(UiController uiController, View view) {
                final Activity activity = getActivity(view.getContext());
                switch (orientation) {
                    case 0:
                        activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                        break;
                    case 1:
                        activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
                        break;
                    case 3:
                        activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT);
                        break;
                    case 4:
                        activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE);
                        break;
                    default:
                        Log.e(LOG_TAG, "Not supported orientation: " + orientation);
                }
                uiController.loopMainThreadUntilIdle();
            }
        });
    }
}

