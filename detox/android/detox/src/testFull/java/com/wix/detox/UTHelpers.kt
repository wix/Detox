package com.wix.detox

import android.view.View
import android.view.ViewGroup
import org.mockito.ArgumentMatchers.eq
import org.mockito.kotlin.whenever
import java.util.concurrent.ExecutorService
import java.util.concurrent.TimeUnit

object UTHelpers {
    fun yieldToOtherThreads(executor: ExecutorService) = executor.awaitTermination(100L, TimeUnit.MILLISECONDS)

    fun mockViewHierarchy(parent: ViewGroup, vararg children: View) {
        whenever(parent.childCount).thenReturn(children.size)

        children.forEachIndexed { index, view ->
            whenever(parent.getChildAt(eq(index))).thenReturn(view)
        }
    }
}
