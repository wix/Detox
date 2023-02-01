package com.wix.detox.reactnative.idlingresources;

import com.wix.detox.espresso.idlingresources.DescriptiveIdlingResource;

import java.util.concurrent.atomic.AtomicBoolean;

public abstract class DetoxBaseIdlingResource implements DescriptiveIdlingResource {
    AtomicBoolean paused = new AtomicBoolean(false);

    public void pause() {
        paused.set(true);
        notifyIdle();
    }

    public void resume() {
        paused.set(false);
    }

    @Override
    final public boolean isIdleNow() {
        if (paused.get()) {
            return true;
        }
        return checkIdle();
    }

    protected abstract boolean checkIdle();
    protected abstract void notifyIdle();
}
