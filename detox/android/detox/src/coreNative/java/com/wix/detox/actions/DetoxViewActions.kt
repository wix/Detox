package com.wix.detox.actions

import android.view.View
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.action.GeneralClickAction
import androidx.test.espresso.action.GeneralLocation
import androidx.test.espresso.action.Press
import androidx.test.espresso.action.ViewActions
import com.wix.detox.espresso.action.DetoxSingleTap
import com.wix.detox.espresso.action.DetoxMultiTap
import com.wix.detox.espresso.action.TakeViewScreenshotAction
import com.wix.detox.espresso.action.ScreenshotResult
import com.wix.detox.espresso.ViewActionWithResult

public object DetoxViewActions {
    public fun tap(): ViewAction =
        ViewActions.actionWithAssertions(GeneralClickAction(DetoxSingleTap(), GeneralLocation.CENTER, Press.FINGER, 0, 0))

    public fun doubleTap() = multiTap(2)

    public fun multiTap(times: Int): ViewAction =
        ViewActions.actionWithAssertions(GeneralClickAction(DetoxMultiTap(times), GeneralLocation.CENTER, Press.FINGER, 0, 0))

    public fun takeScreenshot(): ViewActionWithResult<ScreenshotResult?> =
        TakeViewScreenshotAction()
}
