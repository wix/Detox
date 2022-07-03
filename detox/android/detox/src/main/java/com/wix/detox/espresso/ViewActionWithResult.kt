package com.wix.detox.espresso

interface ViewActionWithResult<R: Any?>: DetoxViewAction {
    fun getResult(): R
}
