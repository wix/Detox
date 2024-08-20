package com.wix.detox.espresso.hierarchy

import android.annotation.SuppressLint
import android.view.View
import java.lang.reflect.Field
import java.lang.reflect.Method

object RootViewsHelper {

    /**
     * Get rootviews from RootViewImpl instances that are stored in WindowManagerGlobal.
     */
    fun getRootViews(): List<View?>? {
        val rootViewsReflectedObjects = getAllViewRootObjects()
        val rootViews = rootViewsReflectedObjects?.map {
            // Root View is stored in the ViewRootImpl instance
            val getViewMethod = it.javaClass.getDeclaredMethod("getView")
            getViewMethod.isAccessible = true

            // Invoke the method to get the root View
            getViewMethod.invoke(it) as? View
        }
        return rootViews
    }

    @SuppressLint("PrivateApi", "DiscouragedPrivateApi")
    private fun getAllViewRootObjects(): List<Any>? {
        return try {
            // Get the WindowManagerGlobal class
            val windowManagerGlobalClass = Class.forName("android.view.WindowManagerGlobal")

            // Get the getInstance method
            val getInstanceMethod: Method = windowManagerGlobalClass.getDeclaredMethod("getInstance")
            getInstanceMethod.isAccessible = true

            // Get the single instance of WindowManagerGlobal
            val windowManagerGlobal = getInstanceMethod.invoke(null)

            // Get the mRoots field, which is a list of ViewRootImpl instances
            val mRootsField: Field = windowManagerGlobalClass.getDeclaredField("mRoots")
            mRootsField.isAccessible = true

            // Return the list of ViewRootImpl instances
            @Suppress("UNCHECKED_CAST")
            mRootsField.get(windowManagerGlobal) as? List<Any>
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
