package com.wix.detox.common

import com.wix.detox.espresso.action.common.ReflectUtils
import org.junit.Test
import org.assertj.core.api.Assertions.assertThat

private const val TEST_CLASS = "com.facebook.react.views.slider.ReactSlider"

class ReflectUtilsTest {
    @Test
    fun `should return false for null source`() {
        assertThat(ReflectUtils.isObjectAssignableFrom(null, TEST_CLASS)).isEqualTo(false)
    }
}