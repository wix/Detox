package com.example;

import android.util.Log;

import androidx.test.platform.app.InstrumentationRegistry;

import com.wix.detoxbutler.DetoxButler;

class TestButlerProbe {

    private static final String LOG_TAG = TestButlerProbe.class.getSimpleName();

    private TestButlerProbe() {
    }

    static void assertReadyIfInstalled() {
        Log.i(LOG_TAG, "Detox butler service verification started...");

        if (!isDetoxButlerServiceInstalled()) {
            Log.w(LOG_TAG, "Detox butler not installed on device - skipping verification");
            return;
        }

        assertDetoxButlerServiceReady();
        Log.i(LOG_TAG, "Detox butler service is up and running!");
    }

    static private boolean isDetoxButlerServiceInstalled() {
        return DetoxButler.isDetoxButlerServiceInstalled(InstrumentationRegistry.getInstrumentation().getContext());
    }

    static private void assertDetoxButlerServiceReady() {
        boolean isEnabled;
        try {
            isEnabled = DetoxButler.tryToWaitForDetoxButlerServiceToBeEnabled(15);
        } catch (Exception e) {
            throw new RuntimeException("Detox butler service is NOT ready!", e);
        }

        if (!isEnabled) {
            throw new RuntimeException("Detox butler service is NOT ready!");
        }
    }
}
