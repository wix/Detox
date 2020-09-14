package com.wix.detox.espresso.base;

import android.os.SystemClock;
import android.util.Log;
import android.view.MotionEvent;

import java.lang.reflect.Method;

class EventInjectionStrategyDebugInvocationHandler extends LoggingInvocationHandler {
    EventInjectionStrategyDebugInvocationHandler(Object eventInjectionStrategy) {
        super(eventInjectionStrategy);
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        if ("injectMotionEvent".equals(method.getName())) {
            MotionEvent me = (MotionEvent) args[0];
            boolean sync = (boolean) args[1];
            long now = SystemClock.uptimeMillis();
            Log.e("ZXCZXC", "injectMotionEvent: [" + now +"] vs. "
                    + "[" + me.getEventTime() + "] "
                    + "(" + (me.getEventTime() - now) + ")"
                    + " isSync="+sync);
            return justInvoke(method, args);
        }
        return super.invoke(proxy, method, args);
    }
}
