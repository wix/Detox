package com.wix.detox.reactnative.idlingresources

import androidx.test.espresso.IdlingResource

interface DescriptiveIdlingResource: IdlingResource {
    fun getDescription(): String
}
