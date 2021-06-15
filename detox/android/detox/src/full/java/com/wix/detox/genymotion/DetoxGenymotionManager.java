package com.wix.detox.genymotion;

import android.content.Context;

import androidx.test.platform.app.InstrumentationRegistry;

import com.genymotion.api.GenymotionManager;

public class DetoxGenymotionManager {
    public static void setLocation(double lat, double lon) {
         GenymotionManager genymotion = getGenymotionManager();
         genymotion.getGps().setLatitude(lat).setLongitude(lon);
    }

    private static GenymotionManager getGenymotionManager() {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext().getApplicationContext();
        return GenymotionManager.getGenymotionManager(context);
    }
}
