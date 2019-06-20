package com.wix.detox.espresso;

interface DetoxErrors {
    class DetoxRuntimeException extends RuntimeException {
        DetoxRuntimeException(Throwable cause) {
            super(cause);
        }

        DetoxRuntimeException(String message) {
            super(message);
        }
    }

    /**
     * Thrown when a Detox action has met conditions where it can no longer have an effect. For
     * example, scrolling a view when it's already at the scrollable limit.
     */
    class StaleActionException extends DetoxRuntimeException {
        StaleActionException(Throwable cause) {
            super(cause);
        }
    }
}
