package com.wix.detox.instruments

import android.content.Context
import com.nhaarman.mockitokotlin2.*
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe
import java.io.File

object DetoxInstrumentsManagerSpec : Spek({
    describe("Instruments manager") {
        lateinit var appContext: Context
        lateinit var instruments: Instruments
        lateinit var instrumentsManager: DetoxInstrumentsManager

        val mockCategory = "MockCategory"
        val mockName = "MockName"
        val mockId = "MockId"
        val mockAdditionalInfo = "MockAdditionalInfo"
        val mockStatus = "MockStatus"
        val mockPath = "/mock"
        val mockSamplingInterval = 100500L

        beforeEachTest {
            appContext = mock()
            instruments = mock()
            instrumentsManager = DetoxInstrumentsManager(appContext, instruments)
        }

        it("should start recording when instruments installed with default params") {
            whenever(instruments.installed()).thenReturn(true)
            instrumentsManager.startRecordingAtLocalPath(mockPath, mockSamplingInterval)

            verify(instruments).installed()
            verify(instruments).startRecording(appContext, true, mockSamplingInterval, File(mockPath), false)
        }

        describe("proxy events") {
            lateinit var recording: InstrumentsRecording

            beforeEachTest {
                recording = mock()
                whenever(instruments.installed()).thenReturn(true)
                whenever(instruments.startRecording(any(), any(), any(), any(), any())).thenReturn(recording)
            }

            it("skipping without started recording") {
                instrumentsManager.eventBeginInterval(mockCategory, mockName, mockId, mockAdditionalInfo)
                instrumentsManager.eventEndInterval(mockId, mockStatus, mockAdditionalInfo)
                instrumentsManager.eventMark(mockCategory, mockName, mockId, mockStatus, mockAdditionalInfo)

                verify(recording, never()).eventBeginInterval(any(), any(), any(), any())
                verify(recording, never()).eventEndInterval(any(), any(), any())
                verify(recording, never()).eventMark(any(), any(), any(), any(), any())
            }

            it("passing within started recording") {
                instrumentsManager.startRecordingAtLocalPath(mockPath, mockSamplingInterval)
                instrumentsManager.eventBeginInterval(mockCategory, mockName, mockId, mockAdditionalInfo)
                instrumentsManager.eventEndInterval(mockId, mockStatus, mockAdditionalInfo)
                instrumentsManager.eventMark(mockCategory, mockName, mockId, mockStatus, mockAdditionalInfo)

                verify(recording).eventBeginInterval(any(), any(), any(), any())
                verify(recording).eventEndInterval(any(), any(), any())
                verify(recording).eventMark(any(), any(), any(), any(), any())
            }

            it("skipping with started recording which was stopped") {
                instrumentsManager.startRecordingAtLocalPath(mockPath, mockSamplingInterval)
                instrumentsManager.stopRecording()
                instrumentsManager.eventBeginInterval(mockCategory, mockName, mockId, mockAdditionalInfo)
                instrumentsManager.eventEndInterval(mockId, mockStatus, mockAdditionalInfo)
                instrumentsManager.eventMark(mockCategory, mockName, mockId, mockStatus, mockAdditionalInfo)

                verify(recording, never()).eventBeginInterval(any(), any(), any(), any())
                verify(recording, never()).eventEndInterval(any(), any(), any())
                verify(recording, never()).eventMark(any(), any(), any(), any(), any())
            }
        }

        it("should not start recording when instruments not installed") {
            whenever(instruments.installed()).thenReturn(false)
            instrumentsManager.startRecordingAtLocalPath(mockPath, mockSamplingInterval)

            verify(instruments).installed()
            verify(instruments, never()).startRecording(any(), any(), any(), any(), any())
        }

        describe("tryInstallJsi") {
            it("proxy when instruments installed") {
                whenever(instruments.installed()).thenReturn(true)
                instrumentsManager.tryInstallJsi()
                verify(instruments).tryInstallJsiHook(appContext)
            }
            it("skipping when instruments not installed") {
                whenever(instruments.installed()).thenReturn(false)
                instrumentsManager.tryInstallJsi()
                verify(instruments, never()).tryInstallJsiHook(any())
            }
        }

        describe("recording") {
            lateinit var recording: InstrumentsRecording

            beforeEachTest {
                recording = mock()

                whenever(instruments.installed()).thenReturn(true)
                whenever(
                        instruments.startRecording(any(), any(), any(), any(), any())
                ).thenReturn(recording)

                instrumentsManager.startRecordingAtLocalPath(mockPath, mockSamplingInterval)
            }

            it("should begin event interval") {
                instrumentsManager.eventBeginInterval(mockCategory, mockName, mockId, mockAdditionalInfo)
                verify(recording).eventBeginInterval(mockCategory, mockName, mockId, mockAdditionalInfo)
            }

            it("should end event interval") {
                instrumentsManager.eventEndInterval(mockId, mockStatus, mockAdditionalInfo)
                verify(recording).eventEndInterval(mockId, mockStatus, mockAdditionalInfo)
            }

            it("should mark event") {
                instrumentsManager.eventMark(mockCategory, mockName, mockId, mockStatus, mockAdditionalInfo)
                verify(recording).eventMark(mockCategory, mockName, mockId, mockStatus, mockAdditionalInfo)
            }

            it("should stop") {
                instrumentsManager.stopRecording()
                verify(recording).stop()
            }
        }
    }
})
