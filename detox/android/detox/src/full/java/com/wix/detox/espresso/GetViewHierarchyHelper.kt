package com.wix.detox.espresso

import android.annotation.SuppressLint
import android.util.Xml
import android.util.Xml.Encoding
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import com.wix.detox.reactnative.ui.getAccessibilityLabel
import org.xmlpull.v1.XmlSerializer
import java.io.StringWriter
import java.lang.reflect.Field
import java.lang.reflect.Method

object GetViewHierarchyHelper {

    @JvmStatic
    fun get(): String {
        val rootViews = getRootViews()
        return getXmlLayoutAsString(rootViews)
    }

    private fun getXmlLayoutAsString(rootViews: List<View?>?): String {
        val xmlSerializer = Xml.newSerializer()
        val stringWriter = StringWriter()
        stringWriter.use {
            xmlSerializer.setOutput(stringWriter)
            xmlSerializer.startDocument(Encoding.UTF_8.name, true)
            xmlSerializer.startTag("", "ViewHierarchy")

            rootViews?.forEach { rootView ->
                rootView?.let {
                    traverseViewHierarchy(
                        view = it,
                        serializer = xmlSerializer,
                    )
                }
            }

            xmlSerializer.endTag("", "ViewHierarchy")
            xmlSerializer.endDocument()
            stringWriter.flush()
        }

        return stringWriter.toString()
    }

    /**
     * Get rootviews from RootViewImpl instances that are stored in WindowManagerGlobal.
     */
    private fun getRootViews(): List<View?>? {
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

    private fun traverseViewHierarchy(view: View, serializer: XmlSerializer) {
        serializer.startTag("", view.javaClass.simpleName)
        writeViewAttributes(view, serializer)
        if (view is ViewGroup) {
            for (i in 0 until view.childCount) {
                traverseViewHierarchy(view.getChildAt(i), serializer)
            }
        }

        serializer.endTag("", view.javaClass.simpleName)
    }

    private fun writeViewAttributes(view: View, serializer: XmlSerializer) {
        if (view.id != View.NO_ID) {
            try {
                serializer.attribute("", "id", view.resources.getResourceName(view.id))
            } catch (e: Exception) {
                serializer.attribute("", "id", view.id.toString())
            }
        }

        serializer.attribute("", "class", view.javaClass.name)

        serializer.attribute("", "width", view.width.toString())
        serializer.attribute("", "height", view.height.toString())

        serializer.attribute(
            "", "visibility", when (view.visibility) {
                View.VISIBLE -> "visible"
                View.INVISIBLE -> "invisible"
                View.GONE -> "gone"
                else -> "unknown"
            }
        )

        val location = IntArray(2)
        view.getLocationInWindow(location)
        val x = location[0]
        val y = location[1]

        serializer.attribute("", "x", x.toString())
        serializer.attribute("", "y", y.toString())
        serializer.attribute("", "alpha", view.alpha.toString())
        serializer.attribute("", "focused", view.isFocused.toString())
        serializer.attribute("", "value", view.contentDescription?.toString() ?: "")
        serializer.attribute("", "label", view.getAccessibilityLabel().toString())
        serializer.attribute("", "tag", view.tag?.toString() ?: "")
        if (view is TextView) {
            serializer.attribute("", "text", view.text.toString())
        }
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
