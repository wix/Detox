package com.wix.detox.common

import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import com.wix.detox.UTHelpers.mockViewHierarchy
import com.wix.detox.reactnative.ui.getAccessibilityLabel
import org.assertj.core.api.Assertions
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class UIExtensionsTest {
    private val alwaysReactNativeObjFn: (Any) -> Boolean = { true }
    private val neverReactNativeObjFn: (Any) -> Boolean = { false }

    private fun withContentDescription(value: String, v: View) { whenever(v.contentDescription).doReturn(value) }
    private fun withText(value: String, v: TextView) { whenever(v.text).doReturn(value) }

    @Test
    fun `should return accessibility label according to content-description`() {
        val view: View = mock()

        val contentDescription = "content-description-mock"
        withContentDescription(contentDescription, view)

        val label = view.getAccessibilityLabel()
        Assertions.assertThat(label).isEqualTo(contentDescription)
    }

    @Test
    fun `should return accessibility label according to children's content-description, recursively`() {
        val contentDescription1st = "cd.1"
        val contentDescription2nd = "cd.2"
        val expectedLabel = "$contentDescription1st $contentDescription2nd"


        val parent: ViewGroup = mock()
        val sibling1: ViewGroup = mock()
        val sibling2: ViewGroup = mock<ViewGroup>().also {
            withContentDescription(contentDescription2nd, it)
        }
        val grandchild: View = mock<View>().also {
            withContentDescription(contentDescription1st, it)
        }

        mockViewHierarchy(parent, sibling1, sibling2)
        mockViewHierarchy(sibling1, grandchild)

        val label = parent.getAccessibilityLabel(alwaysReactNativeObjFn)
        Assertions.assertThat(label).isEqualTo(expectedLabel)
    }

    @Test
    fun `should return accessibility label according to children's text, on top of label`() {
        val text = "some mocked text"

        val parent: ViewGroup = mock()
        val grandchild: TextView = mock<TextView>().also {
            withText(text, it)
        }
        mockViewHierarchy(parent, grandchild)

        val label = parent.getAccessibilityLabel(alwaysReactNativeObjFn)
        Assertions.assertThat(label).isEqualTo(text)
    }

    @Test
    fun `should not return accessibility label if content description not set in view nor its descendants`() {
        val parent: ViewGroup = mock()
        val child: View = mock()

        mockViewHierarchy(parent, child)

        val label = parent.getAccessibilityLabel(alwaysReactNativeObjFn)
        Assertions.assertThat(label).isNull()
    }

    @Test
    fun `should not return accessibility label based on children for non-RN views`() {
        val childContentDescription = "content-description-mock"

        val parent: ViewGroup = mock()
        val child: View = mock<View>().also {
            withContentDescription(childContentDescription, it)
        }
        mockViewHierarchy(parent, child)

        val label = parent.getAccessibilityLabel(neverReactNativeObjFn)
        Assertions.assertThat(label).isNull()
    }

    @Test
    fun `should return accessibility label for non-RN views`() {
        val view: View = mock()

        val contentDescription = "content-description-mock"
        withContentDescription(contentDescription, view)

        val label = view.getAccessibilityLabel(neverReactNativeObjFn)
        Assertions.assertThat(label).isEqualTo(contentDescription)
    }
}
