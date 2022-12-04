package com.wix.detox.espresso

import android.view.View
import androidx.test.espresso.Espresso
import org.hamcrest.Matcher
import org.json.JSONArray
import org.json.JSONObject

abstract class MultipleViewsActionWithResult<R> : ViewActionWithResult<R> {
    fun performOnView(viewMatcher: Matcher<View>): Any {
        val results = ArrayList<JSONObject>()
        var index = 0
        var hasMoreMatchingViews = true

        while (hasMoreMatchingViews) {
            try {
                val matcherAtIndex = DetoxMatcher.matcherForAtIndex(index, viewMatcher)
                Espresso.onView(matcherAtIndex).perform(this)

                val actionResult = this.getResult()

                lateinit var actionResultJson: JSONObject
                actionResultJson = JSONObject(actionResult.toString())

                results.add(actionResultJson)
                index++
            } catch (e: Exception) {
                if (results.isEmpty()) {
                    throw e
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
