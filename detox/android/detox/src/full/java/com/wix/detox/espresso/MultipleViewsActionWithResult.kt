package com.wix.detox.espresso

import android.view.View
import androidx.test.espresso.Espresso
import org.hamcrest.Matcher
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

abstract class MultipleViewsActionWithResult<R> : ViewActionWithResult<R> {
    fun performOnView(viewMatcher: Matcher<View>): Any {
        val results = ArrayList<JSONObject>()
        var index = 0
        var hasMoreMatchingViews = true

        while (hasMoreMatchingViews) {
            kotlin.runCatching {
                val matcherAtIndex = DetoxMatcher.matcherForAtIndex(index, viewMatcher)
                Espresso.onView(matcherAtIndex).perform(this)
            }.onSuccess {
                val actionResult = this.getResult()

                lateinit var actionResultJson: JSONObject
                actionResultJson = JSONObject(actionResult.toString())

                results.add(actionResultJson)
                index++
            }.onFailure {
                if (results.isEmpty()) {
                    throw it
                }

                hasMoreMatchingViews = false
            }
        }
        
        return if (results.size == 1) results.first() else {
            val elementsObject = JSONObject()
            elementsObject.put("elements", JSONArray(results))
        }
    }
}
