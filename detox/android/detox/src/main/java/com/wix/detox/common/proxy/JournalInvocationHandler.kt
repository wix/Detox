package com.wix.detox.common.proxy

import java.lang.reflect.InvocationHandler
import java.lang.reflect.InvocationTargetException
import java.lang.reflect.Method
import java.lang.reflect.Proxy

class JournalInvocationHandler(private val target: Any, private val journal: CallJournal) : InvocationHandler {
    override fun invoke(proxy: Any, m: Method, args: Array<Any>): Any {
        val result: Any
        try {
            journal.onBeforeCall(m.name)
            result = m.invoke(target, *args)
        } catch (e: InvocationTargetException) {
            throw e.targetException
        } finally {
            journal.onAfterCall(m.name)
        }
        return result
    }

    companion object {
        fun newInstance(obj: Any, journal: CallJournal) =
            Proxy.newProxyInstance(
                    obj.javaClass.classLoader,
                    obj.javaClass.interfaces,
                    JournalInvocationHandler(obj, journal))
    }
}
