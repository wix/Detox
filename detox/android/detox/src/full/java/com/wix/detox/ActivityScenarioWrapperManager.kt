package com.wix.detox

import android.app.Activity
import android.content.Intent

class ActivityScenarioWrapperManager {

    fun launch(clazz: Class<Activity>): ActivityScenarioWrapper {
        return ActivityScenarioWrapper.launch(clazz)
    }

    fun launch(intent: Intent): ActivityScenarioWrapper {
        return ActivityScenarioWrapper.launch(intent)
    }
}
