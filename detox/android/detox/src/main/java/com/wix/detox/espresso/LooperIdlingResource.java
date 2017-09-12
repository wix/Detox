package com.wix.detox.espresso;

import android.support.test.espresso.IdlingResource;

/**
 * Created by simonracz on 31/07/2017.
 */

import static com.wix.detox.espresso.QueueInterrogator.QueueState;
import android.os.Handler;
import android.os.Looper;
import android.os.MessageQueue.IdleHandler;
import android.util.Log;

/**
 * An Idling Resource Adapter for Loopers.
 */
final public class LooperIdlingResource implements IdlingResource {

    private static final String LOG_TAG = "Detox";

    private final boolean considerWaitIdle;
    private final Looper monitoredLooper;
    private final Handler monitoredHandler;

    private ResourceCallback resourceCallback;

    private ResourceCallbackIdleHandler resIdleHandler = null;

    public LooperIdlingResource(Looper monitoredLooper, boolean considerWaitIdle) {
        this.monitoredLooper = monitoredLooper;
        this.monitoredHandler = new Handler(monitoredLooper);
        this.considerWaitIdle = considerWaitIdle;
    }

    /**
     * Call this to properly stop the LooperIR.
     */
    public void stop() {
        if (resIdleHandler != null) {
            resIdleHandler.stop = true;
        }
    }

    // Only assigned and read from the main loop.
    private QueueInterrogator queueInterrogator;

    @Override
    public String getName() {
        return monitoredLooper.getThread().getName();
    }

    @Override
    public boolean isIdleNow() {
        // on main thread here.
        QueueState state = queueInterrogator.determineQueueState();
        boolean idle = state == QueueState.EMPTY || state == QueueState.TASK_DUE_LONG;
        boolean idleWait = considerWaitIdle
                && monitoredLooper.getThread().getState() == Thread.State.WAITING;
        if (idleWait) {
            if (resourceCallback != null) {
                resourceCallback.onTransitionToIdle();
            }
        }
        idle = idle || idleWait;
        if (!idle) {
            Log.i(LOG_TAG, getName() + " looper is busy");
        }
        return idle;
    }

    @Override
    public void registerIdleTransitionCallback(ResourceCallback resourceCallback) {
        this.resourceCallback = resourceCallback;
        // on main thread here.
        queueInterrogator = new QueueInterrogator(monitoredLooper);

        // must load idle handlers from monitored looper thread.
        resIdleHandler = new ResourceCallbackIdleHandler(resourceCallback, queueInterrogator,
                monitoredHandler);

        monitoredHandler.postAtFrontOfQueue(new Initializer(resIdleHandler));
    }

    private static class ResourceCallbackIdleHandler implements IdleHandler {
        private final ResourceCallback resourceCallback;
        private final QueueInterrogator myInterrogator;
        private final Handler myHandler;
        public volatile boolean stop = false;

        ResourceCallbackIdleHandler(ResourceCallback resourceCallback,
                                    QueueInterrogator myInterrogator, Handler myHandler) {
            this.resourceCallback = resourceCallback;
            this.myInterrogator = myInterrogator;
            this.myHandler = myHandler;
        }

        @Override
        public boolean queueIdle() {
            if (stop) {
                return false;
            }
            // invoked on the monitored looper thread.
            QueueState queueState = myInterrogator.determineQueueState();
            if (queueState == QueueState.EMPTY || queueState == QueueState.TASK_DUE_LONG) {
                // no block and no task coming 'shortly'.
                resourceCallback.onTransitionToIdle();
            } else if (queueState == QueueState.BARRIER) {
                // send a sentinal message that'll cause us to queueIdle again once the
                // block is lifted.
                myHandler.sendEmptyMessage(-1);
            }

            return !stop;
        }
    }

    private static class Initializer implements Runnable {
        private final IdleHandler myIdleHandler;

        Initializer(IdleHandler myIdleHandler) {
            this.myIdleHandler = myIdleHandler;
        }

        @Override
        public void run() {
            // on monitored looper thread.
            Looper.myQueue().addIdleHandler(myIdleHandler);
        }
    }

}
