package com.wix.detox

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import org.mockito.kotlin.*
import androidx.test.rule.ActivityTestRule
import org.junit.runner.RunWith
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.mockito.ArgumentMatchers.anyBoolean
import org.mockito.ArgumentMatchers.anyString
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ActivityLaunchHelperTest {

    private val initialURL = "detox://unit-test"
    private val bundleExtraLaunchArgs = "launchArgs"
    private val notificationPath = "path/to/notification.data"

    private lateinit var intent: Intent
    private lateinit var launchArgsAsBundle: Bundle
    private lateinit var notificationDataAsBundle: Bundle
    private lateinit var testRule: ActivityTestRule<Activity>
    private lateinit var launchArgs: LaunchArgs
    private lateinit var intentsFactory: LaunchIntentsFactory
    private lateinit var notificationDataParser: NotificationDataParser

    private fun uut() = ActivityLaunchHelper(testRule, launchArgs, intentsFactory, { notificationDataParser })

    @Before
    fun setup() {
        intent = Intent()
        launchArgsAsBundle = mock()
        notificationDataAsBundle = mock()

        testRule = mock()
        launchArgs = mock() {
            on { asIntentBundle() }.thenReturn(launchArgsAsBundle)
        }
        intentsFactory = mock()
        notificationDataParser = mock() {
            on { toBundle() }.thenReturn(notificationDataAsBundle)
        }
    }

    @Test
    fun `default-activity -- should launch using test rule, with a clean intent`() {
        givenCleanLaunch()
        uut().launchActivityUnderTest()
        verify(testRule).launchActivity(eq(intent))
    }

    @Test
    fun `default-activity -- should apply launch args to intent`() {
        givenCleanLaunch()
        uut().launchActivityUnderTest()
        assertIntentHasLaunchArgs()
    }

    @Test
    fun `default activity, with a url -- should launch based on the url`() {
        givenLaunchWithInitialURL()
        uut().launchActivityUnderTest()
        verify(testRule).launchActivity(eq(intent))
        verify(intentsFactory).intentWithUrl(initialURL, true)
    }

    @Test
    fun `default activity, with a url -- should apply launch args to intent`() {
        givenLaunchWithInitialURL()
        uut().launchActivityUnderTest()
        assertIntentHasLaunchArgs()
    }

    @Test
    fun `default activity, with notification data -- should launch with the data as bundle`() {
        givenLaunchWithNotificationData()
        uut().launchActivityUnderTest()
        verify(testRule).launchActivity(eq(intent))
        verify(intentsFactory).intentWithNotificationData(any(), eq(notificationDataAsBundle), eq(true))
    }

    @Test
    fun `default activity, with notification data -- should apply launch args to intent`() {
        givenLaunchWithNotificationData()
        uut().launchActivityUnderTest()
        assertIntentHasLaunchArgs()
    }

    private fun givenCleanLaunch() {
        whenever(intentsFactory.cleanIntent()).thenReturn(intent)
    }
    private fun givenLaunchWithInitialURL() {
        whenever(launchArgs.hasUrlOverride()).thenReturn(true)
        whenever(launchArgs.urlOverride).thenReturn(initialURL)
        whenever(intentsFactory.intentWithUrl(anyString(), anyBoolean())).thenReturn(intent)
    }
    private fun givenLaunchWithNotificationData() {
        whenever(launchArgs.hasNotificationPath()).thenReturn(true)
        whenever(launchArgs.notificationPath).thenReturn(notificationPath)
        whenever(intentsFactory.intentWithNotificationData(any(), any(), anyBoolean()))
            .thenReturn(intent)
    }
    private fun assertIntentHasLaunchArgs() {
        assertThat(intent.hasExtra(bundleExtraLaunchArgs)).isTrue
        assertThat(intent.getBundleExtra(bundleExtraLaunchArgs)).isEqualTo(launchArgsAsBundle)
    }
}
