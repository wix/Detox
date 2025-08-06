package com.wix.detox.espresso.errors

/**
 * Interface for exceptions that provide XML view hierarchy for debugging.
 * Exceptions implementing this interface will have their xmlHierarchy property
 * extracted and used in error reporting.
 */
interface DetoxExceptionWithHierarchy {
    val xmlHierarchy: String
}
