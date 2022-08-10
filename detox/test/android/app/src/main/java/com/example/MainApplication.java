package com.example;

import android.app.Application;
import android.webkit.WebView;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.soloader.SoLoader;

public class MainApplication extends Application implements ReactApplication {
    private final ReactNativeHost mReactNativeHost = new DetoxRNHost(this);

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();

        SoLoader.init(this, /* native exopackage */ false);
        WebView.setWebContentsDebuggingEnabled(true);
    }
}
