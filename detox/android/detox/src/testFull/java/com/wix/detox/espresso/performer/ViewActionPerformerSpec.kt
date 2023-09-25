package com.wix.detox.espresso.performer

import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe
import androidx.test.espresso.ViewAction
import com.wix.detox.espresso.MultipleViewsAction
import org.hamcrest.Matcher
import org.mockito.Mockito.*
import org.mockito.kotlin.mock

object ViewActionPerformerSpec : Spek({

    describe("ViewActionPerformer") {
        context("forAction") {
            context("given a regular ViewAction") {
                val action = mock(ViewAction::class.java)

                it("should return a SingleViewActionPerformer") {
                    val performer = ViewActionPerformer.forAction(action)
                    assert(performer is SingleViewActionPerformer)
                }
            }

            context("given a MultipleViewsAction") {
                val multipleViewsAction: ViewAction = mock(
                    ViewAction::class.java,
                    withSettings().extraInterfaces(MultipleViewsAction::class.java)
                )

                it("should return a MultipleViewsActionPerformer") {
                    val performer = ViewActionPerformer.forAction(multipleViewsAction)
                    assert(performer is MultipleViewsActionPerformer)
                }
            }
        }
    }
})
