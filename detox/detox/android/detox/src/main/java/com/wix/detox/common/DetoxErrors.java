package com.wix.detox.common;

public interface DetoxErrors {
    class DetoxRuntimeException extends RuntimeException {
        public DetoxRuntimeException(Throwable cause) {
            super(cause);
        }
        public DetoxRuntimeException(String message) {
            super(message);
        }
    }

    /**
     * Thrown when a Detox action has met conditions where it can no longer have an effect. For
     * example, scrolling a view when it's already at the scrollable limit.
     */
    class StaleActionException extends DetoxRuntimeException {
        public StaleActionException(Throwable cause) {
            super(cause);
        }
    }

    class DetoxIllegalStateException extends DetoxRuntimeException {
        public DetoxIllegalStateException(String message) {
            super(message);
        }
    }

    class DetoxIllegalArgumentException extends DetoxRuntimeException {
        public DetoxIllegalArgumentException(String message) {
            super(message);
        }

        public DetoxIllegalArgumentException(Throwable cause) {
            super(cause);
        }
    }
}
