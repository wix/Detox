package com.example.detox.purenative

import android.app.Activity
import android.app.Instrumentation
import android.app.Instrumentation.ActivityMonitor
import android.content.Intent
import android.view.View
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.*
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.rule.ActivityTestRule
import androidx.test.uiautomator.UiDevice
import com.wix.detox.actions.DetoxViewActions
import org.hamcrest.CoreMatchers.not
import org.hamcrest.Matcher
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

class ListDriver {
    val itemHeight: Double
        get() = 64.0

    fun listMatcher(): Matcher<View> = withId(R.id.actions_rvList)
    fun itemMatcher(position: Int): Matcher<View> = withText("Item @ position #$position")
}

@RunWith(AndroidJUnit4::class)
class SanityInstrumentationTest {
//    @get:Rule
//    val rule = ActivityTestRule(MainActivity::class.java, true, false)

    private val driver = ListDriver()

    @Before
    fun beforeEach() {
    }

    @Test
    fun testTapping() {
//        launchActivitySync(MainActivity::class.java)

        onView(withId(R.id.main_button_actions)).perform(DetoxViewActions.tap())
        onView(withText("Actions Screen")).check(matches(isCompletelyDisplayed()))

        UiDevice.getInstance(InstrumentationRegistry.getInstrumentation()).pressHome()
        launchActivitySync(MainActivity::class.java)
        onView(withText("Actions Screen")).check(matches(isCompletelyDisplayed()))
    }

//    @Test
    fun testSubtleScrollBy() {
        onView(driver.itemMatcher(1)).check(matches(isCompletelyDisplayed()))
        onView(driver.itemMatcher(5)).check(matches(not(isCompletelyDisplayed())))

        onView(driver.listMatcher()).perform(DetoxViewActions.scrollDownBy(driver.itemHeight))
        onView(driver.itemMatcher(1)).check(matches(not(isCompletelyDisplayed())))
        onView(driver.itemMatcher(5)).check(matches(isCompletelyDisplayed()))

        onView(driver.listMatcher()).perform(DetoxViewActions.scrollUpBy(driver.itemHeight))
        onView(driver.itemMatcher(1)).check(matches(isCompletelyDisplayed()))
        onView(driver.itemMatcher(5)).check(matches(not(isCompletelyDisplayed())))
    }

//    @Test
    fun testScrollBy() {
        onView(driver.listMatcher()).perform(DetoxViewActions.scrollDownBy(driver.itemHeight * 11, 0.1f, 0.95f))
        onView(driver.itemMatcher(14)).check(matches(isCompletelyDisplayed()))
    }

    companion object {
        private fun launchActivitySync(activityClass: Class<*>) {
            val instrumentation = InstrumentationRegistry.getInstrumentation()
            val appContext = instrumentation.targetContext

            val intent = Intent(appContext, activityClass)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            appContext.startActivity(intent)

            val activityMonitor = ActivityMonitor(activityClass.name, null, true)
            instrumentation.addMonitor(activityMonitor)
            instrumentation.waitForMonitorWithTimeout(activityMonitor, 10000L)
        }

    }
}
