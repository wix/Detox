package com.wix.detox.espresso

import androidx.test.espresso.UiController
import com.wix.detox.common.proxy.CallInfo
import com.wix.detox.common.proxy.SpyingInvocationHandler
import com.wix.detox.common.proxy.MethodsSpy
import com.wix.detox.espresso.action.common.utils.getUiController
import org.joor.Reflect

class UiControllerSpy: MethodsSpy("uiController") {
    fun eventInjectionsIterator(): Iterator<CallInfo?> = historyOf("injectMotionEvent").iterator()

    companion object {
        val instance = UiControllerSpy()

        fun attachThroughProxy(spy: UiControllerSpy = instance) {
            val eventsInjectorReflected = EventsInjectorReflected(getUiController())

            val eventsInjectionStrategy = eventsInjectorReflected.eventsInjectionStrategy!!
            val eventsInjectionStrategyProxy = SpyingInvocationHandler.newInstance(eventsInjectionStrategy, spy)

            eventsInjectorReflected.eventsInjectionStrategy = eventsInjectionStrategyProxy
        }
    }
}

private class EventsInjectorReflected constructor(uiController: UiController?) {
    private /*EventInjector*/ val eventInjector: Any? = Reflect.on(uiController).get("eventInjector")

    var eventsInjectionStrategy: Any? /*EventInjectionStrategy*/
        get() = Reflect.on(eventInjector).get<Any>("injectionStrategy")
        set(value) {
            Reflect.on(eventInjector)["injectionStrategy"] = value
        }
}
