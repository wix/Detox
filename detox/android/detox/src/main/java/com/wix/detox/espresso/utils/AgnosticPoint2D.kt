package com.wix.detox.espresso.utils

import com.wix.detox.common.DetoxErrors
import com.wix.detox.espresso.common.annot.MOTION_DIR_DOWN
import com.wix.detox.espresso.common.annot.MOTION_DIR_LEFT
import com.wix.detox.espresso.common.annot.MOTION_DIR_RIGHT
import com.wix.detox.espresso.common.annot.MOTION_DIR_UP

data class FloatingPoint(val x: Float, val y: Float)

data class AgnosticPoint2D(val primary: Double, val secondary: Double) {
    fun toFloatingPoint(direction: Int): FloatingPoint {
        val primaryF = primary.toFloat()
        val secondaryF = secondary.toFloat()
        val isHorizontal = direction == MOTION_DIR_LEFT || direction == MOTION_DIR_RIGHT

        return if (isHorizontal)
            FloatingPoint(primaryF, secondaryF)
        else
            FloatingPoint(secondaryF, primaryF)
    }

    companion object {
        fun fromFloats(x: Float, y: Float, direction: Int): AgnosticPoint2D {
            return fromDoubles(x.toDouble(), y.toDouble(), direction)
        }

        fun fromDoubles(x: Double, y: Double, direction: Int): AgnosticPoint2D {
            return when (direction) {
                MOTION_DIR_LEFT, MOTION_DIR_RIGHT -> AgnosticPoint2D(x, y)
                MOTION_DIR_UP, MOTION_DIR_DOWN -> AgnosticPoint2D(y, x)
                else -> throw DetoxErrors.DetoxIllegalArgumentException("Unsupported swipe direction: $direction")
            }
        }
    }
}