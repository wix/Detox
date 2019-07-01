package com.wix.detox.espresso.scroll

/**
 * Along with [SyncedSwipeExecutor], this was taken from Espresso's own implementation of Swiping
 * (i.e. in [androidx.test.espresso.action.Swipe] - typically dispatched via the
 * [androidx.test.espresso.action.GeneralSwipeAction] action class).
 *
 * The main differences compared to the original impl are:
 * - Number of motion events _isn't_ hardcoded to 10 (as in Espresso's). Mainly, more motions mean that
 *   the overall scrolling will add up to something more accurate (i.e. closer to the scrolling
 *   originally requested by the user, in DP).
 * - Total swipe time _isn't_ hardcoded: Espresso's impl only allows for SLOW=1.5s and FAST=150ms.
 * - More performant: no steps array, no preallocated motion events array. Just code.
 */
class DetoxSwiper(
        private val startX: Float,
        private val startY: Float,
        private val endX: Float,
        private val endY: Float,
        private val swipeDuration: Int,
        private val motionCount: Int,
        private val swipeExecutorProvider: (perMotionTime: Int) -> SwipeExecutor) {

    fun perform() {
        val swipeExecutor = swipeExecutorProvider(swipeDuration / motionCount)
        with(swipeExecutor) {
            startAt(startX, startY)

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
                finishAt(endX, endY)
            }
        }
    }
}
