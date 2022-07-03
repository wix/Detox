package com.wix.detox.espresso

import android.view.View
import androidx.test.espresso.Espresso
import com.wix.detox.common.DetoxErrors
import org.hamcrest.Matcher
import org.json.JSONObject

abstract class MultiViewAction<R> : ViewActionWithResult<R> {
    fun perform(viewMatcher: Matcher<View>): Any {
        val returnArray = ArrayList<JSONObject>()
        var index = 0
        while (true) {
            var hasIndex = true
            kotlin.runCatching {
                Espresso.onView(DetoxMatcher.matcherForAtIndex(index, viewMatcher))
                    .perform(this)
            }.getOrElse {
                false.also { hasIndex = it }
            }

            if (hasIndex) {
                val actionResult = (this as ViewActionWithResult<*>?)?.getResult()
                returnArray.add(JSONObject(actionResult.toString()))
                index++
            } else {
                break
            }
        }

        if (returnArray.size == 0) {
            throw DetoxErrors.DetoxRuntimeException("No views were found to perform the action on")
        }

        return if (returnArray.size == 1) returnArray[0] else returnArray.toTypedArray()
    }
}
