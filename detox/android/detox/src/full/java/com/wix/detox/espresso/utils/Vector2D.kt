package com.wix.detox.espresso.utils

import com.wix.detox.common.DetoxErrors
import com.wix.detox.action.common.MOTION_DIR_DOWN
import com.wix.detox.action.common.MOTION_DIR_LEFT
import com.wix.detox.action.common.MOTION_DIR_RIGHT
import com.wix.detox.action.common.MOTION_DIR_UP
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

private fun frac(value: Double): Double =
    if (value < 0) -frac(-value) else (value - floor(value))

private fun normalize(value: Double): Double
    = if (value < 0) (1 + frac(value)) else frac(value)

private fun clockwise90DegRotationsToDown(direction: Int) = when (direction) {
    MOTION_DIR_LEFT -> 3
    MOTION_DIR_UP -> 2
    MOTION_DIR_RIGHT -> 1
    MOTION_DIR_DOWN -> 0
    else -> throw DetoxErrors.DetoxIllegalArgumentException("Unsupported swipe direction: $direction")
}

private fun angleBetween(fromDirection: Int, toDirection: Int): Int =
    90 * ((4 + clockwise90DegRotationsToDown(fromDirection) - clockwise90DegRotationsToDown(toDirection)) % 4)

data class Vector2D(val x: Double, val y: Double) {
    fun add(other: Vector2D) = Vector2D(x + other.x, y + other.y)

    fun normalize() = Vector2D(normalize(x), normalize(y))

    fun rotate(fromDirection: Int, toDirection: Int) =
            when (angleBetween(fromDirection, toDirection)) {
                90 -> Vector2D(y, -x)
                180 -> Vector2D(-x, -y)
                270 -> Vector2D(-y, x)
                else -> Vector2D(x, y)
            }

    fun scale(amountX: Double, amountY: Double = amountX) = Vector2D(x * amountX, y * amountY)

    fun scale(vector: Vector2D) = scale(vector.x, vector.y)

    fun trimMax(xMax: Double, yMax: Double = xMax) = Vector2D(max(x, xMax), max(y, yMax))

    fun trimMin(xMin: Double, yMin: Double = xMin) = Vector2D(min(x, xMin), min(y, yMin))

    fun withX(value: Double) = Vector2D(value, y)

    fun withY(value: Double) = Vector2D(x, value)

    companion object {
        fun from(arr: FloatArray) = Vector2D(arr[0].toDouble(), arr[1].toDouble())
        fun from(x: Int, y: Int) = Vector2D(x.toDouble(), y.toDouble())
    }
}
