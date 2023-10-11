package com.wix.detox.espresso.common

import android.view.View
import com.google.android.material.slider.Slider
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MaterialSliderHelperTest {
    @Test
    fun `should return value if view is a slider`() {
        val slider: Slider = mock {
            on { value } doReturn 0.2f
        }

        val uut = MaterialSliderHelper(slider)

        assertThat(uut.getValueIfSlider()).isEqualTo(0.2f)
    }

    @Test
    fun `should return null if view is not a slider`() {
        val view: View = mock()

        val uut = MaterialSliderHelper(view)

        assertThat(uut.getValueIfSlider()).isNull()
    }
}
