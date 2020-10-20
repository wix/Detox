package com.wix.detox.reactnative.idlingresources;

import java.util.concurrent.atomic.AtomicBoolean;

import androidx.test.espresso.IdlingResource;

public abstract class DetoxBaseIdlingResource implements IdlingResource {
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
