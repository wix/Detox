export class SnapshotManager {
    constructor(private driver: DetoxDriver) {}

    async takeSnapshot(): Promise<string> {
        return this.driver.takeSnapshot();
    }

    async getViewHierarchy(): Promise<string> {
        return this.driver.getViewHierarchyXML();
    }
}
