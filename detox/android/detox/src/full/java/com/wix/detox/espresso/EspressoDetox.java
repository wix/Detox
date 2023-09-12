package com.wix.detox.espresso;

import com.wix.detox.espresso.performer.ViewActionPerformer;

import android.app.Activity;
import android.content.Context;
import android.content.ContextWrapper;
import android.content.pm.ActivityInfo;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.react.ReactApplication;
import com.wix.detox.common.UIThread;
import com.wix.detox.reactnative.ReactNativeExtension;
import com.wix.detox.reactnative.idlingresources.NetworkIdlingResource;

import org.hamcrest.Matcher;

import java.util.ArrayList;

import androidx.test.espresso.UiController;
import androidx.test.espresso.ViewAction;
import androidx.test.espresso.ViewInteraction;
import androidx.test.espresso.NoMatchingViewException;
import androidx.test.platform.app.InstrumentationRegistry;

import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.matcher.ViewMatchers.isRoot;

/**
 * Created by rotemm on 26/12/2016.
 */
public class EspressoDetox {
    private static final String LOG_TAG = "detox";

    public static Object perform(Matcher<View> matcher, ViewAction action) {
        ViewActionPerformer performer = ViewActionPerformer.forAction(action);
        return performer.performOn(matcher);
    }

    public static Activity getActivity(Context context) {
        if (context instanceof Activity) {
            return (Activity) context;
        }
        while (context instanceof ContextWrapper) {
            if (context instanceof Activity) {
                return (Activity) context;
            }
            context = ((ContextWrapper) context).getBaseContext();
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
                Activity activity = ReactNativeExtension.getRNActivity(view.getContext().getApplicationContext());

                if (activity == null) {
                    activity = getActivity(view.getContext());
                    if (activity == null && view instanceof ViewGroup) {
                        ViewGroup v = (ViewGroup) view;
                        int c = v.getChildCount();
                        for (int i = 0; i < c && activity == null; ++i) {
                            activity = getActivity(v.getChildAt(i).getContext());
                        }
                    }
                }

                if (activity == null) {
                    throw new RuntimeException("Couldn't get a hold of the Activity");
                }

                switch (orientation) {
                    case 0:
                        activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                        break;
                    case 1:
                        activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
                        break;
                    case 2:
                        activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT);
                        break;
                    case 3:
                        activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE);
                        break;
                    default:
                        Log.e(LOG_TAG, "Not supported orientation: " + orientation);
                }
                uiController.loopMainThreadUntilIdle();
            }
        });
    }

    public static void setSynchronization(boolean enabled) {
        if (enabled) {
            Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
            ReactNativeExtension.enableAllSynchronization((ReactApplication) context.getApplicationContext());
        } else {
            ReactNativeExtension.clearAllSynchronization();
        }
    }

    public static void setURLBlacklist(final ArrayList<String> urls) {
        UIThread.postSync(new Runnable() {
            @Override
            public void run() {
                NetworkIdlingResource.setURLBlacklist(urls);
            }
        });
    }
}

