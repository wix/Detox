package com.example;

import android.app.Application;

import com.facebook.react.ReactPackage;
import com.facebook.react.ReactNativeHost;

import java.util.List;

class DetoxRNHost extends ReactNativeHost {
    protected DetoxRNHost(Application application) {
        super(application);
    }

    @Override
    public boolean getUseDeveloperSupport() {
        return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
        // Packages that cannot be autolinked yet can be added manually here, for example:
        //     packages.add(new MyReactNativePackage());
        // TurboModules must also be loaded here providing a valid TurboReactPackage implementation:
        //     packages.add(new TurboReactPackage() { ... });
        // If you have custom Fabric Components, their ViewManagers should also be loaded here
        // inside a ReactPackage.
        return ReactNativeAdapter.getManualLinkedPackages();
    }
}
