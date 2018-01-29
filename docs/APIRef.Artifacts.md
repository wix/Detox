---
id: APIRef.Artifacts
title: Artifacts
---

Artifacts currently include only logs from the app process.

## Enabling artifacts

Artifacts are disabled by default. Two things are required to enable them:

1. **Call `detox.beforeEach()` and `detox.afterEach()` before/after each test**:
	In order for artifacts to work, you have to call `detox.beforeEach()` / `detox.afterEach()` before / after each test. The easiest way to do it is to add beforeEach / afterEach functions to init.js . The following example works with mocha:<br><br>

	```js
	beforeEach(async function() {
	  await detox.beforeEach(this.currentTest.parent.title, this.currentTest.title);
	});
	
	afterEach(async function() {
	  await detox.afterEach();
	});
	``` 

	The arguments provided to beforeEach are optional name components. It's convenient to provide suite name and test name as the components in order to have them in the artifacts per-test folders. If not specified, the test folders will be named by the test numbers.
	
	**Note**: other test runners may have other ways to add the beforeEach/afterEach calls and to fetch test and suite titles.

2. Provide artifacts location via launch arguments:
`--artifacts-location <path>` specifies artifacts location and enables artifacts creation. If you use Detox CLI tools, then the following command will create the artifacts under `/tmp`:

	```sh
	detox test --artifacts-location /tmp
	```

	The provided path should be an existing directory with write permission. Detox will create a new folder `detox_artifacts.<timestamp>` under the provided location. In such way, every additional execution of detox with the same artifacts location will be saved separately.

## Artifacts structure

1. **Artifacts root folder** is created per detox run. If, for instance,`--artifacts-location tmp` is used, then the folder `/tmp/detox_artifacts.2017-07-18T09:02:11.094Z` is created.

2. **Test folder** is created per test inside the root folder. The folder name consists of the test number, and the name components provided to `detox.beforeEach()` as explained above - separated by dots. For instance, for the above example, the following folders will be created inside `/tmp/detox_artifacts.2017-07-18T09:02:11.094Z`:

	```
	1.Sanity.should have welcome 
	2.Sanity.should show hello 
	3.Sanity.should show world 
	4.Matchers.should match 
	5.Matchers.should match 
	6.Matchers.should match 
	7.Matchers.should match 
	8.Matchers.should match 
	```

3. **Artifacts files** are created inside the test folders. The files suffixes stand for the files types (currently there are .err.log and .out.log), and the files prefixes are the launch numbers of the application per test (if the app was executed more than once per test, you will have several artifacts of each type - one per launch). For instance, a test folder may contain the following artifacts files:

	```
	1.err.log
	1.out.log
	2.err.log
	2.out.log
	```

### Example of the structure:

```
/tmp/detox_artifacts.2017-07-18T09:02:11.094Z/1.Sanity.should have welcome screen/1.err.log
/tmp/detox_artifacts.2017-07-18T09:02:11.094Z/1.Sanity.should have welcome screen/1.out.log
/tmp/detox_artifacts.2017-07-18T09:02:11.094Z/2.Sanity.should show hello screen after tap/1.err.log
/tmp/detox_artifacts.2017-07-18T09:02:11.094Z/2.Sanity.should show hello screen after tap/1.out.log
/tmp/detox_artifacts.2017-07-18T09:02:11.094Z/3.Sanity.should show world screen after tap/1.err.log
/tmp/detox_artifacts.2017-07-18T09:02:11.094Z/3.Sanity.should show world screen after tap/1.out.log
/tmp/detox_artifacts.2017-07-18T09:02:11.094Z/4.Matchers.should match elements by (accesibility) label/1.err.log
/tmp/detox_artifacts.2017-07-18T09:02:11.094Z/4.Matchers.should match elements by (accesibility) label/1.out.log
/tmp/detox_artifacts.2017-07-18T09:02:11.094Z/5.Matchers.should match elements by (accesibility) id/1.err.log
/tmp/detox_artifacts.2017-07-18T09:02:11.094Z/5.Matchers.should match elements by (accesibility) id/1.out.log
/tmp/detox_artifacts.2017-07-18T09:02:11.094Z/6.Matchers.should match elements by type (native class)/1.err.log
/tmp/detox_artifacts.2017-07-18T09:02:11.094Z/6.Matchers.should match elements by type (native class)/1.out.log
/tmp/detox_artifacts.2017-07-18T09:02:11.094Z/7.Matchers.should match elements by accesibility trait/1.err.log
/tmp/detox_artifacts.2017-07-18T09:02:11.094Z/7.Matchers.should match elements by accesibility trait/1.out.log
/tmp/detox_artifacts.2017-07-18T09:02:11.094Z/8.Matchers.should match elements with ancenstor (parent)/1.err.log
/tmp/detox_artifacts.2017-07-18T09:02:11.094Z/8.Matchers.should match elements with ancenstor (parent)/1.out.log
```