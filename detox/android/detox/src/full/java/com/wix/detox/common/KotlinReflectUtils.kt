@file:Suppress("UNCHECKED_CAST")

package com.wix.detox.common

import kotlin.reflect.full.memberFunctions
import kotlin.reflect.full.memberProperties
import kotlin.reflect.jvm.isAccessible

object KotlinReflectUtils {


    /**
     * This function should be used only on kotlin properties that have custom getters.
     * In Release builds, such properties are compiled away into getter methods.
     * In Debug builds, such properties exist as fields.
     */
    fun <T> getPropertyValueWithCustomGetter(instance: Any, propertyName: String): T? {
        // In Release builds, properties are compiled away into getter methods.
        val method = instance::class.memberFunctions.find { it.name == propertyName }
        if (method != null) {
            method.isAccessible = true
            return method.call(instance) as T?
        }

        // In debug builds, properties exist as fields.
        val property = instance::class.memberProperties.first { it.name == propertyName }
        property.isAccessible = true
        return (property as? kotlin.reflect.KProperty1<Any, *>)?.get(instance) as T?
    }

}
