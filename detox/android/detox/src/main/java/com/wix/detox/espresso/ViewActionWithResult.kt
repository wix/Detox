package com.wix.detox.espresso

import androidx.test.espresso.ViewAction

// Interface for actions that return a result.
interface ViewActionWithResult<R: Any?> : ViewAction {
    fun getResult(): R
}
