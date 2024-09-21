const {expectViewHierarchySnapshotToMatch} = require("./utils/snapshot");

describe('generate view hierarchy', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Actions')).tap();
  });

  it('generateViewHierarchyXml() - should generate a valid view hierarchy XML without injected test-ids', async () => {
    const hierarchy = await device.generateViewHierarchyXml();
    await expectViewHierarchySnapshotToMatch(hierarchy, `view-hierarchy-without-test-id-injection`);
  });

  it('generateViewHierarchyXml(true) - should generate a valid view hierarchy XML with injected test-ids', async () => {
    const hierarchy = await device.generateViewHierarchyXml(true);
    await expectViewHierarchySnapshotToMatch(hierarchy, `view-hierarchy-with-test-id-injection`);
  });

  it('generateViewHierarchyXml() - should generate xml for web view', async () => {
    await element(by.text('WebView')).tap();
    const hierarchy = await device.generateViewHierarchyXml();
    await expectViewHierarchySnapshotToMatch(hierarchy, `view-hierarchy-web-view`);
  });
});
