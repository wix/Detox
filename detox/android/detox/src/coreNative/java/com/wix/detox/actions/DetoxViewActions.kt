package com.wix.detox.actions

import androidx.test.espresso.action.GeneralClickAction
import androidx.test.espresso.action.GeneralLocation
import androidx.test.espresso.action.Press
import androidx.test.espresso.action.ViewActions.actionWithAssertions
import com.wix.detox.action.common.MOTION_DIR_DOWN
import com.wix.detox.action.common.MOTION_DIR_LEFT
import com.wix.detox.action.common.MOTION_DIR_RIGHT
import com.wix.detox.action.common.MOTION_DIR_UP
import com.wix.detox.espresso.action.DetoxMultiTap
import com.wix.detox.espresso.scroll.DetoxScrollAction
import com.wix.detox.espresso.DetoxViewAction

public object DetoxViewActions {
    public fun tap() = multiTap(1)
    public fun doubleTap() = multiTap(2)
    public fun multiTap(times: Int): DetoxViewAction {
        val viewAction = actionWithAssertions(
            GeneralClickAction(
                DetoxMultiTap(times),
                GeneralLocation.CENTER,
                Press.FINGER,
                0,
                0
            )
        )

        return DetoxViewActionHelper.Companion.convertToDetoxViewAction(viewAction, false);
    }

    public fun scrollUpBy(amountInDp: Double, startOffsetPercentX: Float? = null, startOffsetPercentY: Float? = null): DetoxViewAction {
        val viewAction = actionWithAssertions(
            DetoxScrollAction(
                MOTION_DIR_UP,
                amountInDp,
                startOffsetPercentX,
                startOffsetPercentY
            )
        )

        return DetoxViewActionHelper.Companion.convertToDetoxViewAction(viewAction, false);
    }

    public fun scrollDownBy(amountInDp: Double, startOffsetPercentX: Float? = null, startOffsetPercentY: Float? = null): DetoxViewAction {
        val viewAction = actionWithAssertions(DetoxScrollAction(MOTION_DIR_DOWN, amountInDp, startOffsetPercentX, startOffsetPercentY))
        return DetoxViewActionHelper.Companion.convertToDetoxViewAction(viewAction, false);
    }


    public fun scrollLeftBy(amountInDp: Double, startOffsetPercentX: Float? = null, startOffsetPercentY: Float? = null): DetoxViewAction {
        val viewAction = actionWithAssertions(
            DetoxScrollAction(
                MOTION_DIR_LEFT,
                amountInDp,
                startOffsetPercentX,
                startOffsetPercentY
            )
        )
        return DetoxViewActionHelper.Companion.convertToDetoxViewAction(viewAction, false);
    }

    public fun scrollRightBy(amountInDp: Double, startOffsetPercentX: Float? = null, startOffsetPercentY: Float? = null): DetoxViewAction {
        val viewAction = actionWithAssertions(
            DetoxScrollAction(
                MOTION_DIR_RIGHT,
                amountInDp,
                startOffsetPercentX,
                startOffsetPercentY
            )
        )
        return DetoxViewActionHelper.Companion.convertToDetoxViewAction(viewAction, false);
    }
}
