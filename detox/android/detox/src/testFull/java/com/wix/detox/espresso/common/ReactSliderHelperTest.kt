package com.wix.detox.espresso.common

//import com.facebook.react.views.slider.ReactSlider
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner

/**
 * Note: This only tests against the react *legacy* (non-community) slider in order
 * to avoid having to install the community slider under node_modules just for this.
 */

// FIXME: RN72 upgrade - this test is broken
//@RunWith(RobolectricTestRunner::class)
//class ReactSliderHelperTest {
//    lateinit var slider: ReactSlider
//    lateinit var uut: ReactSliderHelper
//
//    @Before
//    fun setup() {
//        slider = mock()
//        uut = ReactSliderHelper.create(slider)
//    }
//
//    private fun givenNativeProgressTraits(current: Int, max: Int) {
//        whenever(slider.progress).doReturn(current)
//        whenever(slider.max).doReturn(max)
//    }
//
//    @Test
//    fun `should properly calculate current progress, in percentage`() {
//        givenNativeProgressTraits(current = 20, max = 100)
//
//        assertThat(uut.getCurrentProgressPct()).isEqualTo(0.2)
//    }
//}
