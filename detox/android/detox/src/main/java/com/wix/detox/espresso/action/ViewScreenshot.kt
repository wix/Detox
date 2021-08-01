package com.wix.detox.espresso.action

import android.graphics.Bitmap
import android.graphics.Canvas
import android.util.Base64
import android.view.View
import java.io.ByteArrayOutputStream

class ScreenshotResult(private val bitmap: Bitmap) {
    fun asBitmap() = bitmap
    fun asRawBytes(): ByteArray {
        val outStream = ByteArrayOutputStream(bitmap.allocationByteCount)
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, outStream)
        return outStream.toByteArray()
    }
    fun asBase64String(): String =
        Base64.encodeToString(asRawBytes(), Base64.NO_WRAP or Base64.NO_PADDING)
}

class ViewScreenshot() {
    fun takeOf(view: View): ScreenshotResult {
        val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
        view.draw(Canvas(bitmap))

        return ScreenshotResult(bitmap)
    }
}
