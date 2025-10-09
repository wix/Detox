@file:Suppress("UNCHECKED_CAST")

package com.wix.detox.common

import kotlin.reflect.full.memberFunctions
import kotlin.reflect.full.memberProperties
import kotlin.reflect.jvm.isAccessible

object KotlinReflectUtils {

    /**
     * Uses Kotlin reflection to get the value of a property from an instance.
     * Works in both debug and release builds.
     *
     * @param instance The object instance from which to retrieve the property value.
     * @param propertyName The name of the property whose value is to be retrieved.
     * @return The value of the property, or null if not found or inaccessible.
     */
    fun <T> getPropertyValue(instance: Any, propertyName: String): T? {
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
