package com.wix.detox.espresso.base;

import java.lang.reflect.Proxy;

public class EventInjectionStrategyProxy {
    public static Object create(Object eventInjectionStrategy) {
        return Proxy.newProxyInstance(
                eventInjectionStrategy.getClass().getClassLoader(),
                new Class[] { eventInjectionStrategy.getClass().getInterfaces()[0] },
                new EventInjectionStrategyDebugInvocationHandler(eventInjectionStrategy));
    }
}
