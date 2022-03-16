@file:JvmName("MotionDefs")

package com.wix.detox.action.common

import androidx.annotation.IntDef

@Retention(AnnotationRetention.SOURCE)
@IntDef(MOTION_DIR_LEFT, MOTION_DIR_RIGHT, MOTION_DIR_UP, MOTION_DIR_DOWN)
annotation class MotionDir

const val MOTION_DIR_LEFT = 1
const val MOTION_DIR_RIGHT = 2
const val MOTION_DIR_UP = 3
const val MOTION_DIR_DOWN = 4

fun isAscending(@MotionDir direction: Int): Boolean {
    return direction == MOTION_DIR_RIGHT || direction == MOTION_DIR_DOWN
}

fun isDescending(@MotionDir direction: Int): Boolean {
    return direction == MOTION_DIR_LEFT || direction == MOTION_DIR_UP
}

fun isHorizontal(@MotionDir direction: Int): Boolean {
    return direction == MOTION_DIR_LEFT || direction == MOTION_DIR_RIGHT
}

fun isVertical(@MotionDir direction: Int): Boolean {
    return direction == MOTION_DIR_DOWN || direction == MOTION_DIR_UP
}
