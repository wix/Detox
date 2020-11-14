package com.wix.detox.espresso.scroll

import android.content.Context
import android.content.res.Resources
import android.util.DisplayMetrics
import android.view.View
import androidx.test.espresso.action.*
import com.nhaarman.mockitokotlin2.mock
import com.wix.detox.espresso.common.annot.*
import org.mockito.Mockito.`when`
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe
import kotlin.test.assertEquals

object SwiperHelperSpec: Spek({
    describe("SwipeHelper") {
        val view = mock<View>()

        var viewX = 1000
        var viewY = 2000
        var viewWidth = 2000
        var viewHeight = 1000
        var screenWidth = 4000
        var screenHeight = 5000

        fun viewLeft() = viewX + viewWidth * 0f;
        fun viewCenter() = viewX + viewWidth * 0.5f;
        fun viewRight() = viewX + viewWidth * 1f;
        fun viewTop() = viewY + viewHeight * 0f;
        fun viewMiddle() = viewY + viewHeight * 0.5f;
        fun viewBottom() = viewY + viewHeight * 1f;
        fun viewFuzzH() = viewWidth * 0.083f;
        fun viewFuzzV() = viewHeight * 0.083f;

        fun screenTop() = 0f;
        fun screenLeft() = 0f;
        fun screenBottom() = screenTop() + screenHeight
        fun screenRight() = screenLeft() + screenHeight

        beforeGroup {
            val mockDisplayMetrics = mock<DisplayMetrics>()
            mockDisplayMetrics.widthPixels = screenWidth
            mockDisplayMetrics.heightPixels = screenHeight
            val mockResources = mock<Resources>()
            `when`(mockResources.displayMetrics).then { mockDisplayMetrics }
            val mockContext = mock<Context>()
            `when`(mockContext.resources).then { mockResources }
            `when`(view.context).then { mockContext }
            `when`(view.width).then { viewWidth }
            `when`(view.height).then { viewHeight }
            `when`(view.getLocationOnScreen(IntArray(2))).then {
                val arg0 = it.arguments[0]
                val xy = arg0 as IntArray
                xy[0] = viewX
                xy[1] = viewY
                xy
            }
        }

        lateinit var action: GeneralSwipeAction

        fun <T>getActionValue(name: String): T {
            val fieldMeta = GeneralSwipeAction::class.java.getDeclaredField(name)
            fieldMeta.isAccessible = true
            return fieldMeta.get(action) as T
        }

        fun swiper() = getActionValue<Swipe>("swiper")
        fun startCoordinatesProvider() = getActionValue<CoordinatesProvider>("startCoordinatesProvider")
        fun endCoordinatesProvider() = getActionValue<CoordinatesProvider>("endCoordinatesProvider")
        fun precisionDescriber() = getActionValue< PrecisionDescriber>("precisionDescriber")
        fun toPoint(arr: FloatArray) = Pair(arr[0], arr[1])
        fun getStartPoint() = toPoint(startCoordinatesProvider().calculateCoordinates(view))
        fun getEndPoint() = toPoint(endCoordinatesProvider().calculateCoordinates(view))

        it("should return action of fast swipe up") {
            action = SwipeHelper.swipeInDirection(MOTION_DIR_UP);
            assertEquals(Swipe.FAST, swiper())
            assertEquals(Press.FINGER, precisionDescriber())
            assertEquals(Pair(viewCenter(), viewBottom() - viewFuzzV()), getStartPoint())
            assertEquals(Pair(viewCenter(), screenTop()), getEndPoint())
        }
    }
})
