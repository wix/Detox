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
     * This function iterates the view hierachy down and manually draw all
     * TextureViews onto the exisiting canvas. This is a quite naive implementation
     * that does not properly handle all edge cases where e.g. the TextureView might 
     * be underneath a normal view.
     */
    fun drawTextureViewsFromHirachyToCanvas(
            view: View,
            canvas: Canvas,
            offsetLeft: Int,
            offsetTop: Int
    ) {
        if (view is TextureView) {
            val viewBitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
            view.getBitmap(viewBitmap)

            val locationOnScren = IntArray(2) { 0 }
            view.getLocationOnScreen(locationOnScren)

            // determine relative position to the screenshoted view
            // to properly position it on the existing canvas
            val left = (locationOnScren[0] - offsetLeft).toFloat()
            val top = (locationOnScren[1] - offsetTop).toFloat()

            canvas.translate(left, top)
            canvas.drawBitmap(viewBitmap, 0f, 0f, null)
            canvas.translate(-left, -top)
        } else if (view is ViewGroup) {
            for (i in 0..(view.getChildCount() - 1)) {
                val childContainerPos = view.getChildDrawingOrder(i)
                val childView = view.getChildAt(childContainerPos)

                this.drawTextureViewsFromHirachyToCanvas(childView, canvas, offsetLeft, offsetTop)
            }
        }
    }

    fun takeOf(view: View): ScreenshotResult {
        val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        // normal views can simply be drawn via their own draw function
        view.draw(canvas)

        val locationOnScren = IntArray(2) { 0 }
        view.getLocationOnScreen(locationOnScren)
        // texture views do not support this, which is why we have to manually
        // paint them on top of the regular view screenshot to include them
        this.drawTextureViewsFromHirachyToCanvas(
                view,
                canvas,
                locationOnScren[0],
                locationOnScren[1]
        )

        return ScreenshotResult(bitmap)
    }
}
