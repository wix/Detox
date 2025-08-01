package com.wix.detox.espresso.errors

import org.assertj.core.api.Assertions
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class DetoxExceptionUtilsTest {

    @Test
    fun `should clean espresso message by removing view hierarchy`() {
        val originalMessage = """androidx.test.espresso.NoMatchingViewException: No views in hierarchy found matching: (an instance of android.widget.TextView and view.getText() with or without transformation to match: is "supercalifragilisticexpialidocious" and view has effective visibility <VISIBLE>)

View Hierarchy:
+>DecorView{id=-1, visibility=VISIBLE, width=1080, height=2400, has-focus=false, has-focusable=true, has-window-focus=true, is-clickable=false, is-enabled=true, is-focused=false, is-focusable=false, is-layout-requested=false, is-selected=false, layout-params={(0,0)(fillxfill) sim={adjust=resize} ty=BASE_APPLICATION wanim=0x1030309
  fl=LAYOUT_IN_SCREEN LAYOUT_INSET_DECOR SPLIT_TOUCH HARDWARE_ACCELERATED DRAWS_SYSTEM_BAR_BACKGROUNDS
  pfl=NO_MOVE_ANIMATION EDGE_TO_EDGE_ENFORCED FORCE_DRAW_STATUS_BAR_BACKGROUND FIT_INSETS_CONTROLLED
  bhv=DEFAULT
  fitSides=
  frameRateBoostOnTouch=true
  dvrrWindowFrameRateHint=true}, tag=null, root-is-layout-requested=false, has-input-connection=false, x=0.0, y=0.0, child-count=1}"""

        val cleanedMessage = DetoxExceptionUtils.cleanEspressoMessage(originalMessage)

        val expectedMessage = """androidx.test.espresso.NoMatchingViewException: No views in hierarchy found matching: (an instance of android.widget.TextView and view.getText() with or without transformation to match: is "supercalifragilisticexpialidocious" and view has effective visibility <VISIBLE>)"""

        Assertions.assertThat(cleanedMessage).isEqualTo(expectedMessage)
    }

    @Test
    fun `should handle null message`() {
        val cleanedMessage = DetoxExceptionUtils.cleanEspressoMessage(null)
        Assertions.assertThat(cleanedMessage).isEqualTo("")
    }

    @Test
    fun `should handle empty message`() {
        val cleanedMessage = DetoxExceptionUtils.cleanEspressoMessage("")
        Assertions.assertThat(cleanedMessage).isEqualTo("")
    }

    @Test
    fun `should handle message without view hierarchy`() {
        val message = "Simple error message without view hierarchy"
        val cleanedMessage = DetoxExceptionUtils.cleanEspressoMessage(message)
        Assertions.assertThat(cleanedMessage).isEqualTo(message)
    }

    @Test
    fun `should trim whitespace`() {
        val message = "  Error message with whitespace  "
        val cleanedMessage = DetoxExceptionUtils.cleanEspressoMessage(message)
        Assertions.assertThat(cleanedMessage).isEqualTo("Error message with whitespace")
    }
}
