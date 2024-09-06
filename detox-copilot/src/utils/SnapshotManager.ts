export class SnapshotManager {
    constructor(private driver: TestingFrameworkDriver) {}

    async captureSnapshotImage(): Promise<string | undefined> {
        return this.driver.captureSnapshotImage();
    }

    async captureViewHierarchyString(): Promise<string> {
        return this.driver.captureViewHierarchyString();
    }
}
