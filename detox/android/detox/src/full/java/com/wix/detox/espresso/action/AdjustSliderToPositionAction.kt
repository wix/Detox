package com.wix.detox.espresso.action

import android.view.View
import androidx.appcompat.widget.AppCompatSeekBar
import androidx.test.espresso.UiController
import androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import com.wix.detox.espresso.DetoxViewAction
import com.wix.detox.espresso.common.SliderHelper
import org.hamcrest.Matcher
import org.hamcrest.Matchers

class AdjustSliderToPositionAction(private val targetPositionPct: Double) : DetoxViewAction {
    override fun getDescription() = "adjustSliderToPosition"
    override fun isMultiViewAction(): Boolean {
        return false
    }

    override fun getConstraints(): Matcher<View?>? =
        Matchers.allOf( isDisplayed(), isAssignableFrom(AppCompatSeekBar::class.java) )

    override fun perform(uiController: UiController?, view: View) {
        val sliderHelper = SliderHelper.create(view)
        sliderHelper.setProgressPct(targetPositionPct)
    }
}
