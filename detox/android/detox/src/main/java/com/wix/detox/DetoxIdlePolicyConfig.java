package com.wix.detox;

import java.util.concurrent.TimeUnit;

import androidx.test.espresso.IdlingPolicies;

/**
 * Specification of values to use for Espresso's {@link IdlingPolicies} timeouts.
 * <br/>Overrides Espresso's defaults as they tend to be too short (e.g. when running on heavy-load app
 * on suboptimal CI machines).
 */
public class DetoxIdlePolicyConfig {
    /** Directly binds to {@link IdlingPolicies#setMasterPolicyTimeout(long, TimeUnit)}. Applied in seconds. */
    public Integer masterTimeoutSec = 120;
    /** Directly binds to {@link IdlingPolicies#setIdlingResourceTimeout(long, TimeUnit)}. Applied in seconds. */
    public Integer idleResourceTimeoutSec = 60;

    void apply() {
        IdlingPolicies.setMasterPolicyTimeout(masterTimeoutSec, TimeUnit.SECONDS);
        IdlingPolicies.setIdlingResourceTimeout(idleResourceTimeoutSec, TimeUnit.SECONDS);
    }
}
