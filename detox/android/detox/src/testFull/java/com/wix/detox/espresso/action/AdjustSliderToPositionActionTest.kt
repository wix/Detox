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
    val mockReactSliderManager: ReactSliderManager = mock()
    var uut: AdjustSliderToPositionAction = spy(AdjustSliderToPositionAction(0.25, mockReactSliderManager))
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

        assertThat(uut.constraints).isNotNull
        assertThat(uut.constraints!!.matches(null)).isFalse()
        assertThat(uut.constraints!!.matches(1)).isFalse()
        assertThat(uut.constraints!!.matches(mockReactSlider)).isTrue()
        assertThat(uut.constraints!!.matches(mockView)).isFalse()
    }

    @Test
    fun `should change progress of slider`() {
        val mockReactSliderManager: ReactSliderManager = mock {
            on{updateProperties(any(), any())}.thenAnswer{
                doReturn(750).whenever(mockReactSlider).progress
            }
        }
        uut = spy(AdjustSliderToPositionAction(0.75, mockReactSliderManager))
        uut.perform(null, mockReactSlider)

        verify(mockReactSliderManager, times(1)).updateProperties(any(), any())
        assertThat(mockReactSlider.progress).isEqualTo(750)
    }
}
