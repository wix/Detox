package com.wix.detox

import java.util.concurrent.ExecutorService
import java.util.concurrent.TimeUnit

object UTHelpers {
    fun yieldToOtherThreads(executor: ExecutorService) = executor.awaitTermination(100L, TimeUnit.MILLISECONDS)
}
