package com.wix.detox.actions

import androidx.test.espresso.ViewAction
import androidx.test.espresso.action.GeneralClickAction
import androidx.test.espresso.action.GeneralLocation
import androidx.test.espresso.action.Press
import androidx.test.espresso.action.ViewActions.actionWithAssertions
import com.wix.detox.action.common.MOTION_DIR_DOWN
import com.wix.detox.action.common.MOTION_DIR_LEFT
import com.wix.detox.action.common.MOTION_DIR_RIGHT
import com.wix.detox.action.common.MOTION_DIR_UP
import com.wix.detox.espresso.action.DetoxCustomTapper
import com.wix.detox.espresso.scroll.DetoxScrollAction

public object DetoxViewActions {
    public fun tap() = multiTap(1)
    public fun doubleTap() = multiTap(2)
    public fun multiTap(times: Int): ViewAction =
        actionWithAssertions(GeneralClickAction(DetoxCustomTapper(times), GeneralLocation.CENTER, Press.FINGER, 0, 0))

    public fun scrollUpBy(amountInDp: Double, startOffsetPercentX: Float? = null, startOffsetPercentY: Float? = null): ViewAction =
        actionWithAssertions(DetoxScrollAction(MOTION_DIR_UP, amountInDp, startOffsetPercentX, startOffsetPercentY))

    public fun scrollDownBy(amountInDp: Double, startOffsetPercentX: Float? = null, startOffsetPercentY: Float? = null): ViewAction =
        actionWithAssertions(DetoxScrollAction(MOTION_DIR_DOWN, amountInDp, startOffsetPercentX, startOffsetPercentY))

    public fun scrollLeftBy(amountInDp: Double, startOffsetPercentX: Float? = null, startOffsetPercentY: Float? = null): ViewAction =
        actionWithAssertions(DetoxScrollAction(MOTION_DIR_LEFT, amountInDp, startOffsetPercentX, startOffsetPercentY))

    public fun scrollRightBy(amountInDp: Double, startOffsetPercentX: Float? = null, startOffsetPercentY: Float? = null): ViewAction =
        actionWithAssertions(DetoxScrollAction(MOTION_DIR_RIGHT, amountInDp, startOffsetPercentX, startOffsetPercentY))
}
