package com.example;

import android.os.Handler;
import android.os.Looper;

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
    public void nativeSetTimeout(int delay, final Callback callback) {
//        HashMap paramsMap = ((ReadableNativeMap) params).toHashMap();
        Handler handler = new Handler(Looper.getMainLooper());

        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                callback.invoke();
            }
        },delay);
    }
}