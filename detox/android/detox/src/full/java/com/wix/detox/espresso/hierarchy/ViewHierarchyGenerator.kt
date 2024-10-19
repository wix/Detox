package com.wix.detox.espresso.hierarchy

import android.util.Xml
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import android.widget.TextView
import com.wix.detox.reactnative.ui.getAccessibilityLabel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import org.xmlpull.v1.XmlSerializer
import java.io.StringWriter
import kotlin.coroutines.resume


private const val GET_HTML_SCRIPT = """
(function() {
    const blacklistedTags = ['script', 'style', 'head', 'meta'];
    const blackListedTagsSelector = blacklistedTags.join(',');

    // Clone the entire document
    var clonedDoc = document.documentElement.cloneNode(true);

    // Remove all <script> and <style> tags from the cloned document
    var scripts = clonedDoc.querySelectorAll(blackListedTagsSelector);
    scripts.forEach(function(script) {
        script.remove();
    });

    // Create an instance of XMLSerializer
    var serializer = new XMLSerializer();

    // Serialize the cloned DOM to a string
    var serializedHtml = serializer.serializeToString(clonedDoc);

    // Return the serialized HTML as a string
    return serializedHtml;
})();
"""

object ViewHierarchyGenerator {
    @JvmStatic
    fun generateXml(shouldInjectTestIds: Boolean): String {
        return runBlocking {
            val rootViews = RootViewsHelper.getRootViews()
            generateXmlFromViews(rootViews, shouldInjectTestIds)
        }
    }

    private suspend fun generateXmlFromViews(rootViews: List<View?>?, shouldInjectTestIds: Boolean): String {
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

    private suspend fun serializeViewHierarchy(
        view: View,
        serializer: XmlSerializer,
        shouldInjectTestIds: Boolean,
        indexPath: List<Int>
    ) {
        serializer.startTag("", view.javaClass.simpleName)
        serializeViewAttributes(view, serializer, shouldInjectTestIds, indexPath)

        when (view) {
            is WebView -> serializeWebView(view, serializer)
            is ViewGroup -> serializeViewGroupChildren(view, serializer, shouldInjectTestIds, indexPath)
        }

        serializer.endTag("", view.javaClass.simpleName)
    }

    private suspend fun serializeWebView(
        webView: WebView,
        serializer: XmlSerializer,
    ) {
        val html = getWebViewHtml(webView)
        serializer.cdsect(html)
    }

    private suspend fun getWebViewHtml(webView: WebView): String = withContext(Dispatchers.Main) {
        suspendCancellableCoroutine { cancellableContinuation ->
            webView.evaluateJavascript(GET_HTML_SCRIPT) { html ->
                cancellableContinuation.resume(html.unescapeUnicodeString())
            }
        }
    }

    private fun String.unescapeUnicodeString(): String {
        // Replace all Unicode escape sequences (e.g., \u003C -> <)
        return this
            .replace("\\u003C", "<")
            .replace("\\u003E", ">")
            .replace("\\u0022", "\"")
            .replace("\\u0027", "'")
            .replace("\\u0026", "&")
            .replace("\\u003D", "=")
            .replace("\\u002F", "/")
            .replace("\\n", "\n")
    }

    private suspend fun serializeViewGroupChildren(
        view: ViewGroup,
        serializer: XmlSerializer,
        shouldInjectTestIds: Boolean,
        indexPath: List<Int>
    ) {
        for (i in 0 until view.childCount) {
            serializeViewHierarchy(
                view.getChildAt(i),
                serializer,
                shouldInjectTestIds,
                indexPath + i
            )
        }
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
            attributes["id"] = newTestId
        } else {
            attributes["id"] = currentTestId
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
