package com.wix.detox.reactnative.idlingresources

import androidx.test.espresso.IdlingResource

interface DescriptiveIdlingResource: IdlingResource {
    /**
     * Returns a descriptive representation of the resource.
     */
    fun getDescription(): IdlingResourceDescription
}
