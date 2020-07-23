package com.wix.detox.common

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Rect
import android.view.View
import java.io.ByteArrayOutputStream

class ScreenshotResult(private val bitmap: Bitmap) {
    fun asBitmap() = bitmap
    fun asRawBytes(): ByteArray {
        val outStream = ByteArrayOutputStream(if (SDKSupports.API_19_KITKAT) bitmap.allocationByteCount else bitmap.byteCount)
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, outStream)
        return outStream.toByteArray()
    }
}

class ViewScreenshot() {
    fun takeOf(view: View): ScreenshotResult {
        val visibleRect = Rect()
        if (!view.getLocalVisibleRect(visibleRect)) {
            throw IllegalStateException("Cannot take screenshot of a view that's out of screen's bounds")
        }

        val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
        view.draw(Canvas(bitmap))

        val clippedBitmap = Bitmap.createBitmap(bitmap, visibleRect.left, visibleRect.top, visibleRect.width(), visibleRect.height())
        return ScreenshotResult(clippedBitmap)
    }
}
