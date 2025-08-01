package com.wix.detox.espresso.errors

import android.view.View
import androidx.test.espresso.AmbiguousViewMatcherException
import androidx.test.espresso.RootViewException

/**
 * Detox wrapper for AmbiguousViewMatcherException that provides cleaned error messages
 * and preserves the XML hierarchy for debugging.
 */
class DetoxAmbiguousViewMatcherException(
    private val originalException: AmbiguousViewMatcherException,
    override val xmlHierarchy: String
) : RuntimeException(DetoxExceptionUtils.cleanEspressoMessage(originalException.message)), RootViewException, DetoxExceptionWithHierarchy {

    override fun getRootView(): View = originalException.rootView
}
