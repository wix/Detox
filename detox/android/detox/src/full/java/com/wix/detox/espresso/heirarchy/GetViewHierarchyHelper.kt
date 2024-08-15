package com.wix.detox.espresso.heirarchy

import android.util.Xml
import android.util.Xml.Encoding
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import com.wix.detox.reactnative.ui.getAccessibilityLabel
import org.xmlpull.v1.XmlSerializer
import java.io.StringWriter

object GetViewHierarchyHelper {

    @JvmStatic
    fun get(): String {
        val rootViews = RootViewsHelper.getRootViews()
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


}
