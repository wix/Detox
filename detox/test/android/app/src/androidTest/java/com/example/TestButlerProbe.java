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

    static void assertTestButlerReady() {
        Log.i(LOG_TAG, "Test butler service verification started...");

        try {
            assertTestButlerServiceInstalled();
        } catch (Exception e) {
            Log.w(LOG_TAG, "Test butler not installed on device - skipping verification");
            return;
        }

        try {
            assertTestButlerServiceReady();
        } catch (Exception e) {
            Log.w(LOG_TAG, "Test butler service is NOT ready!", e);
            return;
        }
        Log.i(LOG_TAG, "Test butler service is up and running!");
    }

    static private void assertTestButlerServiceInstalled() throws PackageManager.NameNotFoundException {
        PackageManager pm = InstrumentationRegistry.getInstrumentation().getTargetContext().getPackageManager();
        pm.getPackageInfo(TEST_BUTLER_PACKAGE_NAME, 0);
    }

    static private void assertTestButlerServiceReady() {
        // This has no effect if test-butler is running. However, if it is not, then unlike TestButler.setup(), it would hard-fail.
        TestButler.setRotation(Surface.ROTATION_0);
    }
}
