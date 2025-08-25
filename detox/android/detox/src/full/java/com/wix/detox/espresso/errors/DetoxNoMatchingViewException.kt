package com.wix.detox.espresso.errors

import android.view.View
import androidx.test.espresso.NoMatchingViewException
import androidx.test.espresso.RootViewException

/**
 * Detox wrapper for NoMatchingViewException that provides cleaned error messages
 * and preserves the XML hierarchy for debugging.
 */
class DetoxNoMatchingViewException(
    private val originalException: NoMatchingViewException,
    override val xmlHierarchy: String
) : RuntimeException(DetoxExceptionUtils.cleanEspressoMessage(originalException.message)), RootViewException, DetoxExceptionWithHierarchy {

    override fun getRootView(): View = originalException.rootView
}
