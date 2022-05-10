package com.wix.detox.espresso.action.common

object ReflectUtils {
    fun isAssignableFrom(source: Any, className: String)
            = Class.forName(className).isAssignableFrom(source.javaClass)
}
