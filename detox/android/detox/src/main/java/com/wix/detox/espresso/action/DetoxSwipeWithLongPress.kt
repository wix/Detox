package com.wix.detox.espresso.action

import com.wix.detox.espresso.scroll.DetoxSwiper

/**
 * Implementation of the Detox swipe action with long press in the beginning of the swipe and at the end
 */
class DetoxSwipeWithLongPress(
    private val durationStart: Int,
    private val durationEnd: Int,
    private val startX: Float,
    private val startY: Float,
    private val endX: Float,
    private val endY: Float,
    private val motionCount: Int,
    private val swiper: DetoxSwiper
) {

    fun perform() {
        with(swiper) {
            startAt(startX, startY)
            wait(durationStart)
            try {
                val stepSizeX = (endX - startX) / (motionCount + 2f)
                val stepSizeY = (endY - startY) / (motionCount + 2f)

                var targetX = startX
                var targetY = startY
                for (step in 1..motionCount) {
                    targetX += stepSizeX
                    targetY += stepSizeY

                    if (!moveTo(targetX, targetY)) {
                        return
                    }
                }
            } finally {
                moveTo(endX, endY)
                wait(durationEnd)
                finishAt(endX, endY)
            }
        }
    }
}
