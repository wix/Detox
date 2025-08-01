package com.wix.detox.espresso

import android.view.View
import android.util.Log
import androidx.test.espresso.FailureHandler
import androidx.test.espresso.NoMatchingViewException
import androidx.test.espresso.AmbiguousViewMatcherException
import com.wix.detox.espresso.errors.DetoxNoMatchingViewException
import com.wix.detox.espresso.errors.DetoxAmbiguousViewMatcherException
import com.wix.detox.espresso.hierarchy.ViewHierarchyGenerator
import org.hamcrest.Matcher

private const val LOG_TAG = "DetoxFailureHandler"

/**
 * Enhanced failure handler that wraps Espresso exceptions with cleaned error messages
 * and provides XML hierarchy for debugging while eliminating verbose view hierarchy
 * from exception messages.
 */
class DetoxFailureHandler : FailureHandler {

    override fun handle(error: Throwable, viewMatcher: Matcher<View>) {
        when (error) {
            is NoMatchingViewException -> {
                val xmlHierarchy = getSafeViewHierarchy(error.rootView)
                throw DetoxNoMatchingViewException(error, xmlHierarchy)
            }
            is AmbiguousViewMatcherException -> {
                val xmlHierarchy = getSafeViewHierarchy(error.rootView)
                throw DetoxAmbiguousViewMatcherException(error, xmlHierarchy)
            }
            else -> {
                // For other exceptions, just re-throw as-is
                throw error
            }
        }
    }

    private fun getSafeViewHierarchy(rootView: View): String {
        return try {
            ViewHierarchyGenerator.generateXml(rootView, shouldInjectTestIds = false)
        } catch (hierarchyException: Exception) {
            Log.w(LOG_TAG, "Failed to generate view hierarchy", hierarchyException)
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<ViewHierarchy>\n  <!-- Failed to generate hierarchy: ${hierarchyException.message} -->\n</ViewHierarchy>"
        }
    }
}
