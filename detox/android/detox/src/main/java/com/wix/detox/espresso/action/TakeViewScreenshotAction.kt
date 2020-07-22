package com.wix.detox.espresso.action

import android.util.Base64
import android.view.View
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import com.wix.detox.common.ViewScreenshot
import com.wix.detox.espresso.ActionWithResult
import com.wix.detox.espresso.DetoxMatcher
import org.hamcrest.Matcher

class TakeViewScreenshotAction(private val viewScreenshot: ViewScreenshot = ViewScreenshot())
    : ViewAction, ActionWithResult {

    private var result: Any? = null

    override fun perform(uiController: UiController?, view: View?) {
        val rawResult = viewScreenshot.takeOf(view!!).asRawBytes()
        result = Base64.encodeToString(rawResult, Base64.NO_WRAP or Base64.NO_PADDING)
    }

    override fun getResult() = result
    override fun getDescription() = "View screenshot"
    override fun getConstraints(): Matcher<View> = DetoxMatcher.matcherForNotNull()
}
