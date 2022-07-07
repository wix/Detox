package com.wix.detox.espresso

import android.view.View
import androidx.test.espresso.Espresso
import org.hamcrest.Matcher
import org.json.JSONException
import org.json.JSONObject

abstract class MultiViewActionWithResult<R> : ViewActionWithResult<R> {
    fun performOnView(viewMatcher: Matcher<View>): Any {
        val results = ArrayList<JSONObject>()
        var index = 0
        var shouldCheckNextIndex = true

        while (shouldCheckNextIndex) {
            kotlin.runCatching {
                val matcherAtIndex = DetoxMatcher.matcherForAtIndex(index, viewMatcher)
                Espresso.onView(matcherAtIndex).perform(this)
            }.onSuccess {
                val actionResult = this.getResult()

                lateinit var actionResultJson: JSONObject
                try {
                    actionResultJson = JSONObject(actionResult.toString())
                } catch (e: JSONException) {
                    throw e
                }

                results.add(actionResultJson)
                index++
            }.onFailure {
                if (results.isEmpty()) {
                    throw it
                }

                shouldCheckNextIndex = false
            }
        }

        return if (results.size == 1) results.first() else results.toTypedArray()
    }
}
