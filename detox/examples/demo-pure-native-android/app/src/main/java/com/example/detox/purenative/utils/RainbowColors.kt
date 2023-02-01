package com.example.detox.purenative.utils

import android.graphics.Color

class RainbowColors(intervalsCount: Int) {
    private val interval = 360.0 / (intervalsCount.toFloat())

    fun getColor(position: Int): Int {
        return Color.HSVToColor(floatArrayOf((interval * position).toFloat(), 1.0f, 1.0f))
    }
}
