package com.wix.detox.espresso.action

import androidx.test.espresso.UiController
import androidx.test.espresso.action.Tapper
import com.wix.detox.espresso.common.DetoxViewConfigurations.getDoubleTapMinTime
import com.wix.detox.espresso.common.DetoxViewConfigurations.getPostTapCooldownTime

class DetoxMultiTap(private val times: Int, private val interTapsDelayMs: Long?, private val cooldownTime: Long, delegatedTapperGenFn: () -> Tapper): Tapper {
    private var delegateTapper: Tapper = delegatedTapperGenFn()

    constructor(times: Int)
            : this(times, getDoubleTapMinTime(), getPostTapCooldownTime(), { DetoxSingleTap(cooldownTime = 0) })

    override fun sendTap(uiController: UiController?, coordinates: FloatArray?, precision: FloatArray?)
            = sendTap(uiController, coordinates, precision, 0, 0)

    override fun sendTap(uiController: UiController?, coordinates: FloatArray?, precision: FloatArray?, inputDevice: Int, buttonState: Int): Tapper.Status {
        uiController!!
        coordinates!!
        precision!!

        for (i in 1..times) {
            if (delegateTapper.sendTap(uiController, coordinates, precision, inputDevice, buttonState) == Tapper.Status.FAILURE) {
                return Tapper.Status.FAILURE
            }

            if (i < times) {
                interTapsDelayMs?.let {
                    uiController.loopMainThreadForAtLeast(interTapsDelayMs)
                }
            }
        }
        uiController.loopMainThreadForAtLeast(cooldownTime)
        return Tapper.Status.SUCCESS
    }
}
