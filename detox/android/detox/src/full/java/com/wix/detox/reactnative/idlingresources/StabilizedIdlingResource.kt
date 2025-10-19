package com.wix.detox.reactnative.idlingresources

import androidx.test.espresso.IdlingResource.ResourceCallback
/**
 * A wrapper for idling resources that exhibit "flapping" behavior.
 * This wrapper artificially stabilizes them by mindfully extending their "busy" state periods.
 *
 * #### What does flapping mean?
 *
 * Some idling resources have extremely short busy periods. While this shouldn't theoretically be an issue,
 * in real-world scenarios (e.g., a React Native environment), the number of idling resources can accumulate.
 * Unfortunately, the process of checking if all resources are idle (idle interrogation)
 * isn't atomic. With many resources involved, this process might miss those brief busy periods
 * of resources that "flap" (quickly switch between busy and idle) during the interrogation.
 *
 * #### How does this wrapper fix flapping?
 *
 * This wrapper requires the wrapped resource to report itself as "idle" multiple times consecutively
 * before the wrapper itself is considered idle. This dramatically reduces the likelihood of it's busy phase being
 * missed by the idle interrogation process.
 */
class StabilizedIdlingResource(
    private val idlingResource: DetoxIdlingResource,
    private val size: Int): DetoxIdlingResource(), ResourceCallback {

    private val name = "${idlingResource.name} (stable@$size)"
    private var idleCounter = 0

    init {
        if (size <= 1) {
            throw IllegalArgumentException("Size must be > 1 in order for the usage of this class to make sense")
        }
        idlingResource.registerIdleTransitionCallback(this)
    }

    /**
     * Implemented according to these 3 guiding principles:
     * 1. As long as the actual resource is busy - we consider ourselves busy too.
     * 2. Once actual resource is idle enough times in a row - we consider ourselves "idle", in a *sticky* way
     *   (until it returns "busy" in an interrogation).
     * 3. Espresso requires that just before we officially transition ourselves -- idle -> busy, we actively notify it
     *   via the callback.
     */
    @Synchronized
    override fun checkIdle(): Boolean {
        if (!idlingResource.isIdleNow) {
            idleCounter = 0
            return false
        }

        if (idleCounter < size) {
            idleCounter++

            if (idleCounter == size) {
                notifyIdle()
            }
        }
        return (idleCounter == size)
    }

    /**
     * Resets the counter to 0, assuming that Espresso will re-query this (among all other) resources
     * immediately after this "I'm idle" notification.
     */
    @Synchronized
    override fun onTransitionToIdle() {
        idleCounter = 0
        notifyIdle()
    }

    override fun getName(): String = name
    override fun getDebugName(): String = idlingResource.getDebugName()
    override fun getBusyHint(): Map<String, Any>? = idlingResource.getBusyHint()
}
