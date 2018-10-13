package com.example;

import android.os.Bundle;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;

public class MainActivity extends ReactActivity {

    /**
     * Sets the launch options for the React View
     */
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegate(this, getMainComponentName()) {
            @Override
            protected Bundle getLaunchOptions() {
                String launchArgs = getLaunchArgs();
                Bundle bundle = new Bundle();
                if(launchArgs != null) {
                    bundle.putString("launchArgs", launchArgs);
                }
                return bundle;
            }
        };
    }

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "example";
    }

    /**
     * Returns the intent extras as a single string of arguments
     * This is done this way to be consistent with the arguments handling on
     * the iOS side which allows for valueless args
     */
    protected String getLaunchArgs() {
        Bundle bundle = getIntent().getExtras();
        if (bundle == null) {
            return null;
        }

        String string = "";
        String dash = "-";
        for (String key : bundle.keySet()) {
            string += dash + key + " " + bundle.get(key);
            dash = " -";
        }
        return string;
    }
}
