package com.wix.detox.reactnative.idlingresources

import androidx.test.espresso.IdlingResource.ResourceCallback

/**
 * This can be used as a wrapper over actual idling resources which have an extreme flapping nature. It is meant to
 * artificially stabilize them, in the price of longer "busy" state periods.
 *
 * #### What does flapping mean?
 *
 * In some idling resources, the busy periods can be extremely short. While theoretically that shouldn't be an issue,
 * in the real world (e.g. in a React Native environment) the amount of idling resources can pile up. Unfortunately, the
 * idle interrogation process cannot take place "atomically", and with many resources involved it can end up missing
 * out on the busy periods of those that flap during the actual interrogation itself.
 *
 * #### How does this wrapper fix flapping?
 *
 * By demanding the wrapped resource to prove "idle" several times in row before actually considering ourselves idle, the
 * wrapper helps stretch the busy period, substantially reducing the odds of it being missed by the interrogator.
 */
class StabilizedIdlingResource(
    private val idlingResource: DetoxIdlingResource,
    private val length: Int): DetoxIdlingResource(), ResourceCallback {

    private val name = "${idlingResource.name} (stable@$length)"
    private var idleCounter = 0

    init {
        if (length <= 1) {
            throw IllegalArgumentException("Gate size must be > 1 in order for this to make sense")
        }
        idlingResource.registerIdleTransitionCallback(this)
    }

    /**
     * Implemented according to these 3 guiding principles:
     * 1. As long as the actual resource is busy - we consider ourselves busy too.
     * 2. Once actual resource is idle enough times in a row - we consider ourselves "idle", in a sticky way
     *   (indefinitely).
     * 3. Before officially transitioning ourselves idle -> busy, we first have to actively notify Espresso about it via
     *   the callback.
     */
    @Synchronized
    override fun checkIdle(): Boolean {
        if (!idlingResource.isIdleNow) {
            idleCounter = 0
            return false
        }

        if (idleCounter < length) {
            idleCounter++

            if (idleCounter == length) {
                notifyIdle()
            }
        }
        return (idleCounter == length)
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
