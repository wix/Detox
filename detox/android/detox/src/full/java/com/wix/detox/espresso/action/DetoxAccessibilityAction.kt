package com.wix.detox.espresso.action

import android.view.View
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.wix.detox.espresso.DetoxMatcher
import org.hamcrest.Matcher

class DetoxAccessibilityAction(private val mActionName: String) : ViewAction {

    override fun getConstraints(): Matcher<View> = DetoxMatcher.matcherForNotNull()

    override fun getDescription(): String = "Dispatch an Accessibility Action"

    override fun perform(uiController: UiController?, view: View?) {
        val context = view!!.context as ReactContext
        val reactTag = view.id
        val event = Arguments.createMap()
        event.putString("actionName", mActionName)

        val uiManager = UIManagerHelper.getUIManager(context, reactTag) as UIManagerModule?
        uiManager!!.eventDispatcher.dispatchEvent(object : Event<Event<*>>(reactTag) {
            override fun getEventName(): String {
                return "topAccessibilityAction"
            }

            @Deprecated("Deprecated in Java")
            override fun dispatch(rctEventEmitter: RCTEventEmitter) {
                rctEventEmitter.receiveEvent(reactTag, "topAccessibilityAction", event)
            }
        })

        val waitTimeMS = 100
        uiController!!.loopMainThreadForAtLeast(waitTimeMS.toLong())
    }
}
