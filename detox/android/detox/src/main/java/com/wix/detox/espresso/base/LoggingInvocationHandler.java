package com.wix.detox.espresso.base;

import android.os.SystemClock;
import android.util.Log;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;

class LoggingInvocationHandler implements InvocationHandler {
    private final Object subject;

    LoggingInvocationHandler(Object subject) {
        this.subject = subject;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        Log.e("ZXCZXC", "[" + SystemClock.uptimeMillis() +"] " + method.getName() + " <<<" + args + ">>>");
        return justInvoke(method, args);
    }

    protected Object justInvoke(Method method, Object[] args) throws Throwable{
        return method.invoke(subject, args);
    }
}
