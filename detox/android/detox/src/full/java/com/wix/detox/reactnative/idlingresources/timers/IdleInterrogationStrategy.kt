package com.wix.detox.reactnative.idlingresources.timers

interface IdleInterrogationStrategy {
    fun isIdleNow(): Boolean
}
