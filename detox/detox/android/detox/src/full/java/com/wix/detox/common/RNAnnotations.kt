package com.wix.detox.common

import kotlin.annotation.AnnotationTarget.*

/**
 * Source-annotation, indicating that some changes need to be made once the associated RN version
 * (or higher) becomes the one minimally supported by Detox Android.
 */
@Target(FUNCTION, CLASS, CONSTRUCTOR, PROPERTY_GETTER, PROPERTY_SETTER, PROPERTY, FIELD, FILE)
@Retention(AnnotationRetention.SOURCE)
annotation class RNDropSupportTodo(val rnMajorVersion: Int, val message: String)
