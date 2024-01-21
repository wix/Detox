package com.wix.detox.espresso.action

import android.view.View
import android.widget.CheckBox
import android.widget.ProgressBar
import android.widget.TextView
import com.google.android.material.slider.Slider
import com.wix.detox.reactnative.ui.getAccessibilityLabel
import org.assertj.core.api.Assertions.assertThat
import org.json.JSONObject
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class GetAttributesActionTest {
    lateinit var view: View
    lateinit var uut: GetAttributesAction

    @Before
    fun setup() {
        view = mock()
        uut = GetAttributesAction()
    }

    private fun givenViewTag(value: Any?) { whenever(view.tag).doReturn(value) }
    private fun givenNoViewTag() = givenViewTag(null)
    private fun givenVisibility(value: Int) { whenever(view.visibility).doReturn(value) }
    private fun givenVisibilityRectAvailability(value: Boolean) { whenever(view.getLocalVisibleRect(any())).doReturn(value) }
    private fun givenAccessibilityLabel(value: String) { whenever(view.getAccessibilityLabel()).doReturn(value) }

    private fun perform(v: View = view): JSONObject {
        uut.perform(null, v)
        return uut.getResult()!!
    }

    @Test
    fun `should declare non-null view constraint`() {
        assertThat(uut.constraints.matches(null)).isFalse()
        assertThat(uut.constraints.matches(view)).isTrue()
        assertThat(uut.constraints.matches(1)).isFalse()
    }

    @Test
    fun `should return view-tag as ID attribute`() {
        val testId = "mock-test-ID"
        givenViewTag(testId)

        val resultJson = perform()
        assertThat(resultJson.opt("identifier")).isEqualTo(testId)
    }

    @Test
    fun `should not return ID if view has no tag`() {
        givenNoViewTag()

        val resultJson = perform()
        assertThat(resultJson.has("identifier")).isFalse()
    }

    @Test
    fun `should stringify non-text tags set on view`() {
        givenViewTag(1234)

        val resultJson = perform()
        assertThat(resultJson.opt("identifier")).isEqualTo("1234")
    }

    @Test
    fun `should return visibility attributes for a logically visible view`() {
        givenVisibility(View.VISIBLE)
        givenVisibilityRectAvailability(false)

        val resultJson = perform()
        assertThat(resultJson.opt("visibility")).isEqualTo("visible")
        assertThat(resultJson.opt("visible")).isEqualTo(false)
    }

    @Test
    fun `should return visibility attributes for an effectively visible view`() {
        givenVisibility(View.VISIBLE)
        givenVisibilityRectAvailability(true)

        val resultJson = perform()
        assertThat(resultJson.opt("visibility")).isEqualTo("visible")
        assertThat(resultJson.opt("visible")).isEqualTo(true)
    }

    @Test
    fun `should return visibility attributes for an invisible view`() {
        givenVisibility(View.INVISIBLE)

        val resultJson = perform()
        assertThat(resultJson.opt("visibility")).isEqualTo("invisible")
        assertThat(resultJson.opt("visible")).isEqualTo(false)
    }

    @Test
    fun `should return visibility attributes for view that is gone`() {
        givenVisibility(View.GONE)

        val resultJson = perform()
        assertThat(resultJson.opt("visibility")).isEqualTo("gone")
        assertThat(resultJson.opt("visible")).isEqualTo(false)
    }

    @Test
    fun `should return label according to accessibilityLabel extension`() {
        val accessibilityLabel = "label-mock"
        givenAccessibilityLabel(accessibilityLabel)

        val resultJson = perform()
        assertThat(resultJson.opt("label")).isEqualTo(accessibilityLabel)
    }

    @Test
    fun `should not return label if accessibility label is not available`() {
        val resultJson = perform()
        assertThat(resultJson.opt("label")).isNull()
    }

    @Test
    fun `should return common values`() {
        view = mock {
            on { alpha } doReturn 0.42f
            on { width } doReturn 123
            on { height } doReturn 456
            on { elevation } doReturn 0.314f
        }

        val resultJson = perform()
        assertThat(resultJson.opt("alpha")).isEqualTo(0.42f)
        assertThat(resultJson.opt("width")).isEqualTo(123)
        assertThat(resultJson.opt("height")).isEqualTo(456)
        assertThat(resultJson.opt("elevation")).isEqualTo(0.314f)
    }

    @Test
    fun `should return enable and disabled states`() {
        val enabledView: View = mock {
            on { isEnabled } doReturn true
        }
        val disabledView: View = mock {
            on { isEnabled } doReturn false
        }

        assertThat(perform(enabledView).opt("enabled")).isEqualTo(true)
        assertThat(perform(disabledView).opt("enabled")).isEqualTo(false)
    }

    @Test
    fun `should return whether focused or blurred`() {
        val focusedView: View = mock {
            on { isFocused } doReturn true
        }
        val blurredView: View = mock {
            on { isFocused } doReturn false
        }

        assertThat(perform(focusedView).opt("focused")).isEqualTo(true)
        assertThat(perform(blurredView).opt("focused")).isEqualTo(false)
    }

    @Test
    fun `should return check-box state via value attribute`() {
        val checkedCheckBox: CheckBox = mock {
            on { isChecked } doReturn true
        }
        val uncheckedCheckBox: CheckBox = mock {
            on { isChecked } doReturn false
        }

        assertThat(perform(checkedCheckBox).opt("value")).isEqualTo(true)
        assertThat(perform(uncheckedCheckBox).opt("value")).isEqualTo(false)
    }

    @Test
    fun `should return raw ProgressBar or SeekBar 'progress' via value attribute`() {
        val progressBar: ProgressBar = mock {
            on { progress } doReturn 42
        }

        val resultJson = perform(progressBar)
        assertThat(resultJson.opt("value")).isEqualTo(42)
    }

    //FIXME: Complete the integration over RN72 or delete this test
/*    @Test
    fun `should return RN-Slider via value attribute`() {
        val progressBar: ReactSlider = mock {
            on { max } doReturn 100
            on { progress } doReturn 50
        }

        val resultJson = perform(progressBar)
        assertThat(resultJson.opt("value")).isEqualTo(0.5)
    }*/

    @Test
    fun `should return material-Slider state through value attribute`() {
        val slider: Slider = mock {
            on { value } doReturn 0.42f
        }

        val resultJson = perform(slider)
        android.util.Log.i("TESTS", "should return material-Slider state through value attribute: "+ resultJson)
        assertThat(resultJson.opt("value")).isEqualTo(0.42f)
    }

    @Test
    fun `should return text attributes for a TextView`() {
        val textView: TextView = mock {
            on { text } doReturn "mock-text"
            on { textSize } doReturn 24f
            on { length() } doReturn 111
        }

        val resultJson = perform(textView)
        assertThat(resultJson.opt("text")).isEqualTo("mock-text")
        assertThat(resultJson.opt("textSize")).isEqualTo(24f)
        assertThat(resultJson.opt("length")).isEqualTo(111)
    }

    @Test
    fun `should not return text attributes for a text-less TextView`() {
        val textView: TextView = mock {
            on { text } doReturn null
            on { length() } doReturn 0
        }

        val resultJson = perform(textView)
        assertThat(resultJson.has("text")).isFalse()
        assertThat(resultJson.has("length")).isFalse()
    }

    @Test
    fun `should return text hint via 'placeholder' attribute, if applicable`() {
        val textViewWithHint: TextView = mock {
            on { hint } doReturn "hint-text-mock"
        }
        val textView: TextView = mock {
            on { hint } doReturn null
        }

        assertThat(perform(textViewWithHint).opt("placeholder")).isEqualTo("hint-text-mock")
        assertThat(perform(textView).has("placeholder")).isFalse()
    }
}
