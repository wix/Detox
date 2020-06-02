package com.wix.detox.espresso.common

import android.os.Build
import android.util.Log
import android.view.ViewConfiguration
import java.lang.reflect.InvocationTargetException

private const val LOG_TAG = "Detox-ViewConfig"

object DetoxViewConfigurations {

    fun getPostTapCooldownTime() = ViewConfiguration.getDoubleTapTimeout().toLong()

    /**
     * Taken from [androidx.test.espresso.action.Tap]
     */
    fun getDoubleTapMinTime(): Long? {
        if (Build.VERSION.SDK_INT > 18) {
            try {
                val getDoubleTapMinTimeMethod = ViewConfiguration::class.java.getDeclaredMethod("getDoubleTapMinTime")
                return (getDoubleTapMinTimeMethod.invoke(null) as Int).toLong()
            } catch (nsme: NoSuchMethodException) {
                Log.w(LOG_TAG, "Expected to find getDoubleTapMinTime", nsme)
            } catch (ite: InvocationTargetException) {
                Log.w(LOG_TAG, "Unable to query multi-tap min time!", ite)
            } catch (iae: IllegalAccessException) {
                Log.w(LOG_TAG, "Unable to query multi-tap min time!", iae)
            }
        }
        return null
    }
}
