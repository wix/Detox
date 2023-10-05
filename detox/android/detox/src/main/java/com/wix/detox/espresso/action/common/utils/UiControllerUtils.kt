@file:JvmName("UiControllerUtils")

package com.wix.detox.espresso.action.common.utils

import androidx.test.espresso.Espresso
import androidx.test.espresso.UiController
import org.hamcrest.core.IsAnything
import org.joor.Reflect

fun getUiController(): UiController? {
    val interaction = Espresso.onView(IsAnything())
    return Reflect.on(interaction).get<UiController>("uiController")
}
