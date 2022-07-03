package com.wix.detox.espresso.action

import android.view.View
import androidx.test.espresso.UiController
import com.wix.detox.espresso.ViewActionWithResult
import org.hamcrest.Matcher
import org.hamcrest.Matchers

open class TakeViewScreenshotAction(private val viewScreenshot: ViewScreenshot = ViewScreenshot())
    : ViewActionWithResult<ScreenshotResult?> {

    private var result: ScreenshotResult? = null

    override fun perform(uiController: UiController?, view: View?) {
        result = viewScreenshot.takeOf(view!!)
    }

    override fun getResult() = result
    override fun getDescription() = "View screenshot"
    override fun getConstraints(): Matcher<View> = Matchers.notNullValue(View::class.java)
}
