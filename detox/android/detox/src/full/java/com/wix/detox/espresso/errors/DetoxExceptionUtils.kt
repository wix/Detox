package com.wix.detox.espresso.errors

/**
 * Utility class for cleaning and processing Espresso exception messages.
 */
object DetoxExceptionUtils {
    fun cleanEspressoMessage(originalMessage: String?): String {
        val message = originalMessage ?: ""
        // Remove everything after "View Hierarchy:\n" (including it)
        return message.substringBefore("View Hierarchy:\n").trim()
    }
}
