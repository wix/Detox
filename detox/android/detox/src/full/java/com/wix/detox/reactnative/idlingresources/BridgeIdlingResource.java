package com.wix.detox.reactnative.idlingresources;

import android.os.Handler;
import android.os.HandlerThread;
import android.util.Log;

import com.facebook.react.bridge.NotThreadSafeBridgeIdleDebugListener;
import com.facebook.react.bridge.ReactContext;

import org.joor.Reflect;

import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

public class BridgeIdlingResource extends DetoxBaseIdlingResource implements NotThreadSafeBridgeIdleDebugListener {
    private static final String LOG_TAG = "DetoxIR.Bridge";

    private static final long IDLE_POLL_INTERVAL = 20L;

    private final ReactContext reactContext;

    private final HandlerThread idleStatePollingThread = new HandlerThread("Detox.BridgeIRPolling");
    private final Handler idleStatePollingHandler;
    private final CatalystInstanceReflected catalystInstance;

    private ResourceCallback callback = null;

    private final AtomicBoolean idleNow = new AtomicBoolean(true);
    private int idleThreshold = 0;

    public BridgeIdlingResource(ReactContext reactContext) {
        this.reactContext = reactContext;
        this.reactContext.getCatalystInstance().addBridgeIdleDebugListener(this);

        catalystInstance = new CatalystInstanceReflected(reactContext);

        idleStatePollingThread.start();
        idleStatePollingHandler = new Handler(idleStatePollingThread.getLooper());
    }

    public void onDetach() {
        idleStatePollingThread.quit();
        this.reactContext.getCatalystInstance().removeBridgeIdleDebugListener(this);
    }

    @Override
    public String getName() {
        return BridgeIdlingResource.class.getName();
    }

    @NonNull
    @Override
    public String getDebugName() {
        return "bridge";
    }

    @Nullable
    @Override
    public Map<String, Object> getBusyHint() {
        return null;
    }

    @Override
    protected boolean checkIdle() {
        boolean ret = idleNow.get();
        if (!ret) {
            Log.i(LOG_TAG, "JS Bridge is busy");
        }
        return ret;
    }

    @Override
    public void registerIdleTransitionCallback(ResourceCallback callback) {
        this.callback = callback;
    }

    @Override
    public void onTransitionToBridgeBusy() {
        idleStatePollingHandler.post(this::sync_handleBusyEvent);
    }

    @Override public void onTransitionToBridgeIdle() {}
    @Override public void onBridgeDestroyed() {}

    @Override
    protected void notifyIdle() {
        if (callback != null) {
            callback.onTransitionToIdle();
        }
    }

    private void sync_handleBusyEvent() {
        if (idleNow.getAndSet(false)) {
            Log.i(LOG_TAG, "JS Bridge transitions to busy");
            sync_pollBridgeState();
        }
    }

    private void sync_pollBridgeState() {
        if (idleNow.get()) {
            Log.d(LOG_TAG, "Inquiry skipped because we've been set idle");
            return;
        }

        Log.d(LOG_TAG, "Inquiring status...");
        if (isBridgeIdle()) {
            Log.d(LOG_TAG, "IDLE");
            idleNow.set(true);
            notifyIdle();
        } else {
            Log.d(LOG_TAG, "BUSY");
            idleStatePollingHandler.postDelayed(this::sync_pollBridgeState, IDLE_POLL_INTERVAL);
        }
    }

    private boolean isBridgeIdle() {
        final AtomicInteger pendingJsCallsInt = catalystInstance.pendingJSCallsCounter();
        final int pendingJsCalls = pendingJsCallsInt.get();

        Log.d(LOG_TAG, "#calls="+pendingJsCalls + " (threshold="+idleThreshold+", isLower="+(pendingJsCalls < idleThreshold) +")");

        if (pendingJsCalls < idleThreshold) {
            idleThreshold = pendingJsCalls;

            Log.d(LOG_TAG, "UPDATED THRESHOLD TO "+idleThreshold);
        }

        return (pendingJsCalls == idleThreshold);
    }

    private static class CatalystInstanceReflected {
        private final ReactContext reactContext;

        CatalystInstanceReflected(ReactContext context) {
            this.reactContext = context;
        }

        AtomicInteger pendingJSCallsCounter() {
            return Reflect.on(this.reactContext.getCatalystInstance()).get("mPendingJSCalls");
        }
    }
}
