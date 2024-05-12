package com.wix.detox

import android.app.Activity
import android.content.Intent
import androidx.test.core.app.ActivityScenario

class ActivityScenarioWrapper private constructor(private val activityScenario: ActivityScenario<Activity>) {

    fun close() {
        activityScenario.close()
    }

    companion object {
        fun launch(clazz: Class<Activity>): ActivityScenarioWrapper {
            return ActivityScenarioWrapper(ActivityScenario.launch(clazz))
        }

        fun launch(intent: Intent): ActivityScenarioWrapper {
            return ActivityScenarioWrapper(ActivityScenario.launch(intent))
        }
    }
}
