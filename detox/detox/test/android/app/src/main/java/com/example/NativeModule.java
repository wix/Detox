package com.example;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.widget.LinearLayout;
import android.widget.LinearLayout.LayoutParams;
import android.widget.TextView;

import com.example.utils.ReactNativeExtensionReflected;
import com.example.utils.ViewSpies;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

public class NativeModule extends ReactContextBaseJavaModule {

    private static final String NAME = "NativeModule";

    private ReactApplicationContext reactContext;

    NativeModule(ReactApplicationContext reactContext) {
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
        handler.postDelayed(callback::invoke, delay);
    }

    @ReactMethod
    public void switchToNativeRoot() {
        reactContext.getCurrentActivity().runOnUiThread(() -> {
            Activity currentActivity = getCurrentActivity();

            LinearLayout layout = new LinearLayout(currentActivity);
            layout.setGravity(Gravity.CENTER);
            LayoutParams llp = new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);

            TextView tv = new TextView(currentActivity);
            tv.setText("this is a new native root");
            LayoutParams lp = new LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
            tv.setLayoutParams(lp);

            layout.addView(tv);
            currentActivity.setContentView(layout, llp);
        });
    }

    @ReactMethod
    public void switchToMultipleReactRoots() {
        reactContext.getCurrentActivity().runOnUiThread(() -> {}); // TODO?
    }

    @ReactMethod
    public void getLaunchArguments(Promise promise) {
        promise.resolve(parseIntentExtras("launchArgs"));
    }

    @ReactMethod
    public void parseNotificationData(String innerKey, Promise promise) {
        Bundle data = getIntentExtras(innerKey);
        data.remove("launchArgs");
        promise.resolve(Arguments.fromBundle(data));
    }

    @ReactMethod
    public void spyLongTaps(String testID) {
        new ViewSpies.LongTapCrasher(testID).attach();
    }

    @ReactMethod
    public void chokeMainThread() {
        reactContext.getCurrentActivity().runOnUiThread(() -> {
            try {
                Thread.sleep(10500);
            } catch (InterruptedException e) {
                e.printStackTrace();
                throw new RuntimeException(e);
            }
        });
    }

    @ReactMethod
    public void crashMainThread() {
        reactContext.getCurrentActivity().runOnUiThread(() -> {
            throw new RuntimeException("Simulated crash (native)");
        });
    }

    @ReactMethod
    public void toggleNonStorageSynchronization(Boolean enable) {
        ReactNativeExtensionReflected rnExtension = ReactNativeExtensionReflected.getInstance();
        rnExtension.toggleUISynchronization(enable);
        rnExtension.toggleTimersSynchronization(enable);
        rnExtension.toggleNetworkSynchronization(enable);
    }

    private WritableMap parseIntentExtras(String bundleKey) {
        Bundle extras = getIntentExtras(bundleKey);
        return Arguments.fromBundle(extras);
    }

    private Bundle getIntentExtras(String bundleKey) {
        final Activity currentActivity = getCurrentActivity();
        if (currentActivity == null) {
            return new Bundle();
        }

        final Intent intent = currentActivity.getIntent();
        final Bundle extras = (bundleKey == null ? intent.getExtras() : intent.getBundleExtra(bundleKey));
        if (extras == null) {
            return new Bundle();
        }

        return extras;
    }
}
