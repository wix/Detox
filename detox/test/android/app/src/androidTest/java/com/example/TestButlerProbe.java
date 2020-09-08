package com.example;

import android.content.pm.PackageManager;
import android.util.Log;
import android.view.Surface;

import com.linkedin.android.testbutler.TestButler;

import androidx.test.platform.app.InstrumentationRegistry;

class TestButlerProbe {

    private static final String LOG_TAG = TestButlerProbe.class.getSimpleName();
    private static final String TEST_BUTLER_PACKAGE_NAME = "com.linkedin.android.testbutler";

    private TestButlerProbe() {
    }

    static void assertReadyIfInstalled() {
        Log.i(LOG_TAG, "Test butler service verification started...");

        if (!isTestButlerServiceInstalled()) {
            Log.w(LOG_TAG, "Test butler not installed on device - skipping verification");
            return;
        }

        assertTestButlerServiceReady();
        Log.i(LOG_TAG, "Test butler service is up and running!");
    }

    static private boolean isTestButlerServiceInstalled() {
        try {
            PackageManager pm = InstrumentationRegistry.getInstrumentation().getTargetContext().getPackageManager();
            pm.getPackageInfo(TEST_BUTLER_PACKAGE_NAME, 0);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    static private void assertTestButlerServiceReady() {
        try {
            // This has no effect if test-butler is running. However, if it is not, then unlike TestButler.setup(), it would hard-fail.
            TestButler.setRotation(Surface.ROTATION_0);
        } catch (Exception e) {
            throw new RuntimeException("Test butler service is NOT ready!", e);
        }
    }
}
