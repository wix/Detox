package com.wix.detox.espresso.action

import android.view.View
import androidx.appcompat.widget.AppCompatSeekBar
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import com.wix.detox.espresso.common.ReactSliderHelper
import org.hamcrest.Matcher
import org.hamcrest.Matchers

class AdjustSliderToPositionAction(private val targetPositionPct: Float) : ViewAction {
    override fun getDescription() = "adjustSliderToPosition"
    override fun getConstraints(): Matcher<View?>? =
        Matchers.allOf( isDisplayed(), isAssignableFrom(AppCompatSeekBar::class.java) )

    override fun perform(uiController: UiController?, view: View) {
        val sliderHelper = ReactSliderHelper.create(view)
        sliderHelper.setProgressPct(targetPositionPct)
    }
}
