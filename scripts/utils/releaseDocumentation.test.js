jest.mock('shell-utils');
const exec = require('shell-utils').exec;

jest.mock('fs');
const fs = require('fs');

const documentation = require('./releaseDocumentation');

describe('Documentation script', () => {
  beforeAll(() => {
    process.chdir = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should build new version', () => {
    const version = '1.0.0';
    fs.readFileSync.mockReturnValue(JSON.stringify([]));
    documentation.buildDocsForVersion('1.0.0');

    expect(exec.execSync).toHaveBeenCalledTimes(5);
    expect(process.chdir).toHaveBeenCalledWith(docsPath());

    expect(exec.execSync).toHaveBeenCalledWith(`npm install`);
    expect(exec.execSync).toHaveBeenCalledWith(`npm run docusaurus docs:version ${version}`);
    expect(exec.execSync).toHaveBeenCalledWith(`git add .`);
    expect(exec.execSync).toHaveBeenCalledWith(`git commit -m "Publish docs version ${version}"`);
    expect(exec.execSync).toHaveBeenCalledWith(`git push origin master`);
    expect(process.chdir).toHaveBeenCalledWith(process.cwd());
  });

  it('should override version', () => {
    fs.readFileSync.mockReturnValue(JSON.stringify(['1.0.0', '2.0.0']));

    const removeVersion = '2.0.0';
    documentation.removeDocsForVersion(removeVersion);

    expect(exec.execSync).toHaveBeenCalledTimes(2);

    expect(exec.execSync).toHaveBeenCalledWith(
      `rm -rf ${docsPath()}/versioned_docs/version-${removeVersion}`
    );
    expect(exec.execSync).toHaveBeenCalledWith(
      `rm -f ${docsPath()}/versioned_sidebars/version-${removeVersion}-sidebars.json`
    );
  });
});

function docsPath() {
  return `${process.cwd()}/website`;
}
