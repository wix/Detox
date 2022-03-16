package com.wix.detox.instruments;

public class DetoxInstrumentsException extends RuntimeException {
    public DetoxInstrumentsException(String message) {
        super(message);
    }

    public DetoxInstrumentsException(Throwable cause) {
        super(cause);
    }
}
