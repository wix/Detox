package com.wix.detox.reactnative.utils

private const val REACT_NATIVE_PACKAGE = "com.facebook.react"

fun isReactNativeObject(obj: Any): Boolean =
    obj.javaClass.canonicalName?.startsWith(REACT_NATIVE_PACKAGE) == true
