package com.wix.detox.espresso

import android.view.View
import androidx.test.espresso.*
import com.wix.detox.espresso.DetoxMatcher.matcherForAtIndex
import org.hamcrest.Matcher
import org.json.JSONObject


class DetoxViewInteraction(private val viewMatcher: Matcher<View>) {
    var viewInteraction: ViewInteraction

    init {
        viewInteraction = Espresso.onView(viewMatcher)
    }

    fun withFailureHandler(failureHandler: FailureHandler): ViewInteraction {
        return viewInteraction.withFailureHandler(failureHandler)
    }

    fun inRoot(rootMatcher: Matcher<Root>): ViewInteraction {
        return viewInteraction.inRoot(rootMatcher)
    }

    fun noActivity(): ViewInteraction {
        return viewInteraction.noActivity()
    }

    fun check(viewAssert: ViewAssertion): ViewInteraction {
        return viewInteraction.check(viewAssert)
    }

    fun perform(viewAction: ViewAction): Any? {
        val getAttributesDesc = "Get view attributes"
        val returnArray = ArrayList<JSONObject>()

        if (viewAction.description == getAttributesDesc) {
            var index = 0
            while (true) {
                var hasIndex = true
                kotlin.runCatching {
                    Espresso.onView(matcherForAtIndex(index, viewMatcher))
                        .perform(viewAction)
                }.getOrElse {
                    false.also { hasIndex = it }
                }

                if (hasIndex) {
                    val actionResult = (viewAction as ViewActionWithResult<*>?)?.getResult()
                    returnArray.add(JSONObject(actionResult.toString()))
                    index++
                } else {
                    break
                }
            }

            return returnArray.toTypedArray()
        } else {
            kotlin.run {
                Espresso.onView(viewMatcher)
                    .perform(viewAction)
            }

            return if (viewAction is ViewActionWithResult<*>) {
                viewAction.getResult()
            } else {
                null
            }
        }
    }
}
