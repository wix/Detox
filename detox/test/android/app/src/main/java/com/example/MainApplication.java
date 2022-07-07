package com.example;

import android.app.Application;
import android.webkit.WebView;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.soloader.SoLoader;

public class MainApplication extends Application implements ReactApplication {
    private final ReactNativeHost mReactNativeHost = (
            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED ?
                new DetoxRNHostNewArch(this) :
                new DetoxRNHost(this));

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();

        // If you opted-in for the New Architecture, we enable the TurboModule system
        ReactFeatureFlags.useTurboModules = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;

        SoLoader.init(this, /* native exopackage */ false);
        WebView.setWebContentsDebuggingEnabled(true);
    }
}
