package com.wix.detox.espresso.action

import android.graphics.Bitmap
import android.graphics.Canvas
import android.util.Base64
import android.view.TextureView
import android.view.View
import android.view.ViewGroup
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
    /**
     * Texture views do not support to drar themselves. To still capture them for a screenshot
     * we have to traverse and render them manually. Some libraries like react-native-skia use them.
     */
    fun drawTextureViews(view: View, canvas: Canvas) {
        if (view is TextureView) {
            val viewBitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
            view.getBitmap(viewBitmap)
            canvas.drawBitmap(viewBitmap, 0f, 0f, null)
        } else if (view is ViewGroup) {
            for (i in 0..(view.getChildCount() - 1)) {
                val childContainerPos = view.getChildDrawingOrder(i)
                val childView = view.getChildAt(childContainerPos)

                val left = childView.left.toFloat()
                val top = childView.top.toFloat()

                canvas.translate(left, top);
                this.drawTextureViews(childView, canvas)
                canvas.translate(-left, -top);
            }
        }
    }

    fun takeOf(view: View): ScreenshotResult {
        val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        view.draw(canvas)
        this.drawTextureViews(view, canvas)

        return ScreenshotResult(bitmap)
    }
}
