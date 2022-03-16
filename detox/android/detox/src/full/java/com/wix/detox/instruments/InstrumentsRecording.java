package com.wix.detox.instruments;


public interface InstrumentsRecording {
    void stop();

    void eventBeginInterval(
            String category,
            String name,
            String id,
            String additionalInfo
    );

    void eventEndInterval(
            String id,
            String eventStatus,
            String additionalInfo
    );

    void eventMark(
            String category,
            String name,
            String id,
            String eventStatus,
            String additionalInfo
    );
}
