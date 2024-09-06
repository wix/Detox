package com.wix.detox.espresso.hierarchy

import android.util.Xml
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import com.wix.detox.reactnative.ui.getAccessibilityLabel
import org.xmlpull.v1.XmlSerializer
import java.io.StringWriter

object ViewHierarchyGenerator {
    @JvmStatic
    fun generateXml(shouldInjectTestIds: Boolean): String {
        val rootViews = RootViewsHelper.getRootViews()
        return generateXmlFromViews(rootViews, shouldInjectTestIds)
    }

    private fun generateXmlFromViews(rootViews: List<View?>?, shouldInjectTestIds: Boolean): String {
        return StringWriter().use { writer ->
            val serializer = Xml.newSerializer().apply {
                setOutput(writer)
                startDocument(Xml.Encoding.UTF_8.name, true)
                setFeature("http://xmlpull.org/v1/doc/features.html#indent-output", true)
                startTag("", "ViewHierarchy")
            }

            rootViews?.forEach { rootView ->
                rootView?.let {
                    serializeViewHierarchy(it, serializer, shouldInjectTestIds, emptyList())
                }
            }

            serializer.apply {
                endTag("", "ViewHierarchy")
                endDocument()
            }

            writer.toString()
        }
    }

    private fun serializeViewHierarchy(
        view: View,
        serializer: XmlSerializer,
        shouldInjectTestIds: Boolean,
        indexPath: List<Int>
    ) {
        serializer.startTag("", view.javaClass.simpleName)
        serializeViewAttributes(view, serializer, shouldInjectTestIds, indexPath)

        if (view is ViewGroup) {
            for (i in 0 until view.childCount) {
                serializeViewHierarchy(
                    view.getChildAt(i),
                    serializer,
                    shouldInjectTestIds,
                    indexPath + i
                )
            }
        }

        serializer.endTag("", view.javaClass.simpleName)
    }

    private fun serializeViewAttributes(
        view: View,
        serializer: XmlSerializer,
        shouldInjectTestIds: Boolean,
        indexPath: List<Int>
    ) {
        val attributes = mutableMapOf(
            "class" to view.javaClass.name,
            "width" to view.width.toString(),
            "height" to view.height.toString(),
            "visibility" to view.visibilityToString(),
            "alpha" to view.alpha.toString(),
            "focused" to view.isFocused.toString(),
            "value" to (view.contentDescription?.toString() ?: ""),
            "label" to (view.getAccessibilityLabel()?.toString() ?: "")
        )

        view.id.takeIf { it != View.NO_ID }?.let {
            attributes["id"] = try {
                view.resources.getResourceName(it)
            } catch (e: Exception) {
                it.toString()
            }
        }

        val location = IntArray(2).apply { view.getLocationInWindow(this) }
        attributes["x"] = location[0].toString()
        attributes["y"] = location[1].toString()

        if (view is TextView) {
            attributes["text"] = view.text.toString()
        }

        val currentTestId = view.tag?.toString() ?: ""

        val injectedPrefix = "detox_temp_"
        val isTestIdEmpty = currentTestId.isEmpty()
        val isTestIdInjected = currentTestId.startsWith(injectedPrefix)
        val shouldInjectNewTestId = shouldInjectTestIds && (isTestIdEmpty || isTestIdInjected)

        if (shouldInjectNewTestId) {
            val newTestId = "${injectedPrefix}${indexPath.joinToString("_")}"
            view.tag = newTestId
            attributes["testID"] = newTestId
        } else {
            attributes["testID"] = currentTestId
        }

        attributes
            .filter { (_, value) ->
                !value.isNullOrEmpty()
            }
            .forEach { (key, value) ->
                serializer.attribute("", key, value)
            }
    }

    private fun View.visibilityToString() = when (visibility) {
        View.VISIBLE -> "visible"
        View.INVISIBLE -> "invisible"
        View.GONE -> "gone"
        else -> "unknown"
    }
}
