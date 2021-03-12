package com.example;

import android.app.Activity;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.widget.LinearLayout;
import android.widget.LinearLayout.LayoutParams;
import android.widget.TextView;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;


public class NativeModule extends ReactContextBaseJavaModule {

    public static final String NAME = "NativeModule";
    ReactApplicationContext reactContext;

    public NativeModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void echoWithoutResponse(String string) {
        Log.d(NAME, string);
    }

    @ReactMethod
    public void echoWithResponse(String string) {
        Log.d(NAME, string);
    }

    @ReactMethod
    public void nativeSetTimeout(int delay, final Callback callback) {
//        HashMap paramsMap = ((ReadableNativeMap) params).toHashMap();
        Handler handler = new Handler(Looper.getMainLooper());

        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                callback.invoke();
            }
        }, delay);
    }

    @ReactMethod
    public void switchToNativeRoot() {
        reactContext.getCurrentActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Activity currentActivity = getCurrentActivity();

                LinearLayout layout = new LinearLayout(currentActivity);
                layout.setGravity(Gravity.CENTER);
                LinearLayout.LayoutParams llp = new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);

                TextView tv = new TextView(currentActivity);
                tv.setText("this is a new native root");
                LinearLayout.LayoutParams lp = new LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
                tv.setLayoutParams(lp);

                layout.addView(tv);
                currentActivity.setContentView(layout, llp);
            }
        });
    }

    @ReactMethod
    public void switchToMultipleReactRoots() {
        reactContext.getCurrentActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {

            }
        });
    }
}