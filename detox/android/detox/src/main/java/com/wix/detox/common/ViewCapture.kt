package com.wix.detox.common

import android.graphics.Bitmap
import android.graphics.Canvas
import android.view.View
import java.io.ByteArrayOutputStream

class CaptureResult(private val bitmap: Bitmap) {
    fun asBitmap() = bitmap
    fun asRawBytes(): ByteArray {
        val outStream = ByteArrayOutputStream(if (SDKSupports.API_19_KITKAT) bitmap.allocationByteCount else bitmap.byteCount)
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, outStream)
        return outStream.toByteArray()
    }
}

class ViewCapture() {
    fun takeOf(view: View): CaptureResult {
        val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        view.draw(canvas)
        return CaptureResult(bitmap)
    }
}
