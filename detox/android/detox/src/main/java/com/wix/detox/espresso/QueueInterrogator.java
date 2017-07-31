package com.wix.detox.espresso;

/**
 * Created by simonracz on 31/07/2017.
 */

        import android.os.Handler;
        import android.os.Looper;
        import android.os.Message;
        import android.os.MessageQueue;
        import android.os.SystemClock;
        import android.util.Log;

        import java.lang.reflect.Field;

        import java.lang.reflect.Method;
        import java.util.concurrent.Callable;
        import java.util.concurrent.ExecutionException;
        import java.util.concurrent.FutureTask;

/**
 * Isolates the nasty details of touching the message queue.
 */
final class QueueInterrogator {

    enum QueueState { EMPTY, TASK_DUE_SOON, TASK_DUE_LONG, BARRIER };

    private static final String TAG = "QueueInterrogator";

    private static final Method messageQueueNextMethod;
    private static final Field messageQueueHeadField;
    private static final int LOOKAHEAD_MILLIS = 15;

    private final Looper interrogatedLooper;
    private volatile MessageQueue interrogatedQueue;

    static {
        Method nextMethod = null;
        Field headField = null;
        try {
            nextMethod = MessageQueue.class.getDeclaredMethod("next");
            nextMethod.setAccessible(true);

            headField = MessageQueue.class.getDeclaredField("mMessages");
            headField.setAccessible(true);
        } catch (IllegalArgumentException e) {
            nextMethod = null;
            headField = null;
            Log.e(TAG, "Could not initialize interrogator!", e);
        } catch (NoSuchFieldException e) {
            nextMethod = null;
            headField = null;
            Log.e(TAG, "Could not initialize interrogator!", e);
        } catch (NoSuchMethodException e) {
            nextMethod = null;
            headField = null;
            Log.e(TAG, "Could not initialize interrogator!", e);
        } catch (SecurityException e) {
            nextMethod = null;
            headField = null;
            Log.e(TAG, "Could not initialize interrogator!", e);
        } finally {
            messageQueueNextMethod = nextMethod;
            messageQueueHeadField = headField;
        }
    }

    QueueInterrogator(Looper interrogatedLooper) {
        this.interrogatedLooper = interrogatedLooper;
    }

    // Only for use by espresso - keep package private.
    Message getNextMessage() {
        checkThread();

        if (null == interrogatedQueue) {
            initializeQueue();
        }

        try {
            return (Message) messageQueueNextMethod.invoke(Looper.myQueue());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    QueueState determineQueueState() {
        // may be called from any thread.

        if (null == interrogatedQueue) {
            initializeQueue();
        }
        synchronized (interrogatedQueue) {
            try {
                Message head = (Message) messageQueueHeadField.get(interrogatedQueue);
                if (null == head) {
                    // no messages pending - AT ALL!
                    return QueueState.EMPTY;
                }
                if (null == head.getTarget()) {
                    // null target is a sync barrier token.
                    return QueueState.BARRIER;
                } else {
                    long headWhen = head.getWhen();
                    long nowFuz = SystemClock.uptimeMillis() + LOOKAHEAD_MILLIS;

                    if (nowFuz > headWhen) {
                        return QueueState.TASK_DUE_SOON;
                    } else {
                        return QueueState.TASK_DUE_LONG;
                    }
                }
            } catch (IllegalAccessException e) {
                throw new RuntimeException(e);
            }
        }
    }

    private void initializeQueue() {
        if (interrogatedLooper == Looper.myLooper()) {
            interrogatedQueue = Looper.myQueue();
        } else {
            Handler oneShotHandler = new Handler(interrogatedLooper);
            FutureTask<MessageQueue> queueCapture = new FutureTask<MessageQueue>(
                    new Callable<MessageQueue>() {
                        @Override
                        public MessageQueue call() {
                            return Looper.myQueue();
                        }
                    });
            oneShotHandler.postAtFrontOfQueue(queueCapture);
            try {
                interrogatedQueue = queueCapture.get();
            } catch (ExecutionException ee) {
                throw new RuntimeException(ee);
            } catch (InterruptedException ie) {
                throw new RuntimeException(ie);
            }
        }
    }

    private void checkThread() {

    }
}
