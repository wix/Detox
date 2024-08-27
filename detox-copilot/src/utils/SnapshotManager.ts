export class SnapshotManager {
    constructor(private driver: TestingFrameworkDriver) {}

    async takeSnapshot(): Promise<string | undefined> {
        return this.driver.takeSnapshot();
    }

    async getViewHierarchy(): Promise<string> {
        return this.driver.getViewHierarchy();
    }
}
