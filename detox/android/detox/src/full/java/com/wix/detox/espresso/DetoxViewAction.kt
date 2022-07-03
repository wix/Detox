package com.wix.detox.espresso

import androidx.test.espresso.ViewAction

interface DetoxViewAction : ViewAction {
    fun isMultiViewAction(): Boolean
}