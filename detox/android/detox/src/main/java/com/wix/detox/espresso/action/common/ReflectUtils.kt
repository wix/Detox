package com.wix.detox.espresso.action.common

class ReflectUtils {
    companion object {
        fun isObjectAssignableFrom(source: Any?, target: String): Boolean {
            return if (source != null) Class.forName(target).isAssignableFrom(source.javaClass) else false
        }
    }
}