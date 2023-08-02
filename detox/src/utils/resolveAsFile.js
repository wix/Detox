const crypto = require('crypto');
const path = require('path');
const { URL, fileURLToPath } = require('url');

const axios = require('axios').default;
const fs = require('fs-extra');
const tempfile = require('tempfile');

const md5 = (text) => crypto.createHash('md5').update(text).digest('hex');
const tempDir = path.dirname(tempfile());

const NO_ETAG = '00000000000000000000000000000000';

async function resolveAsFile(maybeFilePath) {
  try {
    const url = new URL(maybeFilePath);
    if (url.protocol === 'file:') {
      return fileURLToPath(url);
    }

    const filename = path.posix.basename(url.pathname);
    const { headers } = await axios.head(url.toString());
    const etag = headers.etag ? md5(headers.etag) : NO_ETAG;
    const tempFilePath = path.join(tempDir, etag, filename);
    if (etag !== NO_ETAG && fs.existsSync(tempFilePath)) {
      return tempFilePath;
    }

    await fs.ensureDir(path.dirname(tempFilePath));
    // Download url to tempFilePath via axios
    const response = await axios.get(url.toString(), {
      responseType: 'stream',
    });
    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    return tempFilePath;

  } catch (e) {
    if (e.code === 'ERR_INVALID_URL') {
      return maybeFilePath;
    }

    throw e;
  }
}

module.exports = resolveAsFile;
