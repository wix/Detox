package com.wix.detox.espresso.action

import android.view.View
import com.facebook.react.views.slider.ReactSlider
import com.facebook.react.views.slider.ReactSliderManager
import com.nhaarman.mockitokotlin2.*
import org.assertj.core.api.Assertions.assertThat
import org.hamcrest.Matcher
import org.junit.Before
import org.junit.Test

@Suppress("IllegalIdentifier")
class AdjustSliderToPositionActionTest {
    var uut: AdjustSliderToPositionAction = spy(AdjustSliderToPositionAction(0.25))
    private lateinit var mockReactSlider: ReactSlider

    @Before
    fun setup() {
        mockReactSlider = mock {
            on {progress}.thenReturn(250)
        }
    }

    @Test
    fun `should have correct description`() {
        assertThat(uut.description).isEqualTo("adjustSliderToPosition")
    }

    @Test
    fun `should have correct constraints`() {
        val mockReactSlider: ReactSlider = mock()
        val mockView: View = mock()
        val mockIsDisplayed: Matcher<View?> = mock {
            on {matches(any())}.thenReturn(true)
        }
        doReturn(mockIsDisplayed).whenever(uut).getIsDisplayed()

        uut.constraints?.let { assertThat(it.matches(null)).isFalse() }
        uut.constraints?.let { assertThat(it.matches(1)).isFalse() }
        uut.constraints?.let { assertThat(it.matches(mockReactSlider)).isTrue() }
        uut.constraints?.let { assertThat(it.matches(mockView)).isFalse() }
    }

    @Test
    fun `should change progress of slider`() {
        val mockReactSliderManager: ReactSliderManager = mock {
            on{updateProperties(any(), any())}.thenAnswer{
                doReturn(750).whenever(mockReactSlider).progress
            }
        }
        uut = spy(AdjustSliderToPositionAction(0.75))
        doReturn(mockReactSliderManager).whenever(uut).getReactSliderManager()
        uut.perform(null, mockReactSlider)

        verify(mockReactSliderManager, times(1)).updateProperties(any(), any())
        assertThat(mockReactSlider.progress).isEqualTo(750)
    }

    @Test
    fun `should ignore illegal values`() {
        uut = AdjustSliderToPositionAction(Double.NaN)
        uut.perform(null, mockReactSlider)
        uut = AdjustSliderToPositionAction(-100.0)
        uut.perform(null, mockReactSlider)
    }
}
