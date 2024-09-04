const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '.env')
});

class PromptHandler {
  constructor() {
    this.config = {
      appID: process.env.APP_ID,
      appSecret: process.env.APP_SECRET,
      instanceId: process.env.INSTANCE_ID,
      serverlessEndpoint: process.env.SERVERLESS_ENDPOINT,
      tokenEndpoint: process.env.TOKEN_ENDPOINT,
      uploadUrlEndpoint: process.env.UPLOAD_URL_ENDPOINT,
      promptId: process.env.PROMPT_ID,
    };

    const emptyValues = Object.values(this.config).some(value => !value);
    if (emptyValues) {
      throw new Error(`Missing required environment variables: ${Object.keys(this.config).join(', ')}`);
    }
  }

  async createToken() {
    const response = await axios.post(this.config.tokenEndpoint, {
      grant_type: 'client_credentials',
      client_id: this.config.appID,
      client_secret: this.config.appSecret,
      instance_id: this.config.instanceId,
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    return response.data.access_token;
  }

  async createUploadUrl(token, filename) {
    const response = await axios.post(this.config.uploadUrlEndpoint, {
      mimeType: 'image/png',
      fileName: filename,
      namespace: 'NO_NAMESPACE',
    }, {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      }
    });

    return response.data.uploadUrl;
  }

  async uploadFile(uploadUrl, fileName, fileContent) {
    const params = new URLSearchParams({ filename: fileName });
    const urlWithParams = `${uploadUrl}?${params.toString()}`;

    try {
      const response = await axios.put(urlWithParams, fileContent, {
        headers: { 'Content-Type': 'image/png' }
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading file', error);
      return null;
    }
  }

  async uploadImage(imagePath) {
    const fileContent = await fs.readFile(imagePath);
    const token = await this.createToken();
    const uploadUrl = await this.createUploadUrl(token, path.basename(imagePath));
    const response = await this.uploadFile(uploadUrl, path.basename(imagePath), fileContent);
    return response.file.url;
  }

  async runPrompt(prompt, image) {
    if (!image) {
      throw new Error('Image is required');
    }

    const imageUrl = await this.uploadImage(image);

    const body = {
      promptId: this.config.promptId,
      prompt,
      image: imageUrl
    };

    try {
      const response = await axios.post(this.config.serverlessEndpoint, body, {
        headers: {
          'x-wix-model-hub-timeout': '600000',
          'x-time-budget': '600000',
        },
        timeout: 600000
      });

      const generatedText = response.data?.response?.generatedTexts?.[0];
      if (!generatedText) {
        throw new Error('Failed to generate text');
      }

      return generatedText;
    } catch (error) {
      console.error('Error running prompt:', error);
      throw error;
    }
  }

  isSnapshotImageSupported() {
    return true;
  }
}

module.exports = PromptHandler;
