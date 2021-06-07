package com.wix.detox.espresso

import androidx.test.platform.app.InstrumentationRegistry

object DeviceDisplay {
    @JvmStatic
    fun getDensity() = getDisplayMetrics().density

    @JvmStatic
    fun convertDpiToPx(dip: Double): Int {
        return (dip * getDensity() + 0.5f).toInt()
    }

    @JvmStatic
    fun convertPxToDpi(pixel: Int): Int {
        return ((pixel - 0.5f) / getDensity()).toInt()
    }

    @JvmStatic
    fun getScreenSizeInPX(): FloatArray? {
        val metrics = getDisplayMetrics()
        return floatArrayOf(metrics.widthPixels.toFloat(), metrics.heightPixels.toFloat())
    }

    private fun getDisplayMetrics() =
            getAppContext().resources.displayMetrics

    private fun getAppContext() =
            InstrumentationRegistry.getInstrumentation().targetContext.applicationContext
}
