package com.wix.detox.espresso.action.common

object ReflectUtils {
    fun isAssignableFrom(source: Any, className: String) =
        try {
            Class.forName(className).isAssignableFrom(source.javaClass)
        } catch (ex: ClassNotFoundException) {
            false
        }
}
