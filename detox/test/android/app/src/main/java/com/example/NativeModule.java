package com.example;

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.LinearLayout.LayoutParams;
import android.widget.TextView;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.util.ReactFindViewUtil;
import com.facebook.react.uimanager.util.ReactFindViewUtil.OnMultipleViewsFoundListener;

import java.util.HashSet;
import java.util.Set;

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

    @ReactMethod
    public void getLaunchArguments(Promise promise) {
        final Activity currentActivity = getCurrentActivity();
        if (currentActivity != null) {
            final Bundle launchArgs = currentActivity.getIntent().getBundleExtra("launchArgs");
            if (launchArgs != null) {
                final WritableMap launchArgsMap = Arguments.fromBundle(launchArgs);
                promise.resolve(launchArgsMap);
                return;
            }
        }
        promise.resolve(Arguments.createMap());
    }

    @ReactMethod
    public void spyLongTaps(final String testID) {
        new LongTapCrasher(testID).attach();
    }

    /**
     * Implementation note: For this purpose, a simpler RN API exists in the same class -
     * {@link ReactFindViewUtil#addViewListener(ReactFindViewUtil.OnViewFoundListener)}.
     * However, it is found to be a bit buggy since it removes all listeners immediately
     * after being called (i.e. while iterating) with no thread-sync mechanisms to protect it.
     * If real life (CI), we've genuinely seen that it throws ConcurrentModificationException exceptions,
     * on occasions (and why wouldn't it? - our demo app's ActionsScreen has multiple views subscribing and
     * called concurrently; could it be that not always everything is run in the main thread?).
     * Therefore, we use here {@link ReactFindViewUtil#addViewsListener(OnMultipleViewsFoundListener, Set)},
     * which is too generic but nevertheless allows us to better control when we are to be removed.
     */
    private static class LongTapCrasher implements OnMultipleViewsFoundListener {

        private final String testID;

        private LongTapCrasher(String testID) {
            this.testID = testID;
        }

        public void attach() {
            final Set<String> nativeIds = new HashSet<>();
            nativeIds.add(testID);

            ReactFindViewUtil.addViewsListener(this, nativeIds);
        }

        @Override
        public void onViewFound(View view, String nativeId) {
            view.setOnLongClickListener(v -> {
                throw new IllegalStateException("Validation failed: component \"" + testID + "\" was long-tapped!!!");
            });
            view.post(() -> ReactFindViewUtil.removeViewsListener(this));
        }
    }
}
