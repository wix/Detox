package com.wix.detox.espresso.idlingresources

import androidx.test.espresso.IdlingResource

interface DescriptiveIdlingResource: IdlingResource {
    fun getDebugName(): String
    fun getBusyHint(): Map<String, Any>?
}
