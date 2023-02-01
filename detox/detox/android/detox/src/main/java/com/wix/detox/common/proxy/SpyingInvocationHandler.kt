package com.wix.detox.common.proxy

import java.lang.reflect.InvocationHandler
import java.lang.reflect.InvocationTargetException
import java.lang.reflect.Method
import java.lang.reflect.Proxy

class SpyingInvocationHandler(private val target: Any, private val spy: MethodsSpy) : InvocationHandler {
    override fun invoke(proxy: Any, m: Method, args: Array<Any>): Any {
        val result: Any
        try {
            spy.onBeforeCall(m.name)
            result = m.invoke(target, *args)
        } catch (e: InvocationTargetException) {
            throw e.targetException
        } finally {
            spy.onAfterCall(m.name)
        }
        return result
    }

    companion object {
        @JvmStatic
        fun newInstance(obj: Any, journal: MethodsSpy) =
            Proxy.newProxyInstance(
                    obj.javaClass.classLoader,
                    obj.javaClass.interfaces,
                    SpyingInvocationHandler(obj, journal))
    }
}
