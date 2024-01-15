package com.example;

import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.reactcommunity.rndatetimepicker.RNDateTimePickerPackage;
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import com.reactnativecommunity.checkbox.ReactCheckBoxPackage;
import com.reactnativecommunity.geolocation.GeolocationPackage;
import com.reactnativecommunity.slider.ReactSliderPackage;
import com.reactnativecommunity.webview.RNCWebViewPackage;
import com.reactnativelauncharguments.LaunchArgumentsPackage;
import com.zoontek.rnpermissions.RNPermissionsPackage;

import java.util.Arrays;
import java.util.List;

class ReactNativeAdapter {
    public static List<ReactPackage> getManualLinkPackages() {
        return Arrays.asList(
            new MainReactPackage(),
            new ReactSliderPackage(),
            new GeolocationPackage(),
            new RNCWebViewPackage(),
            new NativeModulePackage(),
            new AsyncStoragePackage(),
            new ReactCheckBoxPackage(),
            new RNDateTimePickerPackage(),
            new LaunchArgumentsPackage(),
            new RNPermissionsPackage()
        );
    }
}
