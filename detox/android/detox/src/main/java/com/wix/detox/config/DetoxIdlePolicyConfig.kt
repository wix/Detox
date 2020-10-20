package com.wix.detox.config

import androidx.test.espresso.IdlingPolicies
import java.util.concurrent.TimeUnit

/**
 * Specification of values to use for Espresso's {@link IdlingPolicies} timeouts.
 *
 * Overrides Espresso's defaults as they tend to be too short (e.g. when running a heavy-load app
 * on suboptimal CI machines).
 */
class DetoxIdlePolicyConfig {
    /** Directly binds to [IdlingPolicies.setMasterPolicyTimeout]. Applied in seconds.  */
    @JvmField var masterTimeoutSec = 240

    /** Directly binds to [IdlingPolicies.setIdlingResourceTimeout]. Applied in seconds.  */
    @JvmField var idleResourceTimeoutSec = 180

    fun apply() {
        IdlingPolicies.setMasterPolicyTimeout(masterTimeoutSec.toLong(), TimeUnit.SECONDS)
        IdlingPolicies.setIdlingResourceTimeout(idleResourceTimeoutSec.toLong(), TimeUnit.SECONDS)
    }
}
