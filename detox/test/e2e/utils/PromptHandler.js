const axios = require('axios');
const fs = require('fs').promises;

class PromptHandler {
  async uploadImage(imagePath) {
    const image = await fs.readFile(imagePath);

    try {
      const response = await axios.post('https://bo.wix.com/mobile-infra-ai-services/v1/image-upload', {
        image,
      });

      const imageUrl = response.data.url;
      if (!imageUrl) {
        throw new Error('Cannot find uploaded URL, got response:', response.data);
      }

      return imageUrl;
    } catch (error) {
      console.error('Error while uploading image:', error);
      throw error;
    }
  }

  async runPrompt(prompt, image) {
    if (!image) {
      throw new Error('Image is required');
    }

    const imageUrl = await this.uploadImage(image);

    try {
      const response = await axios.post('https://bo.wix.com/mobile-infra-ai-services/v1/prompt', {
        prompt,
        model: 'SONNET_3_5',
        ownershipTag: 'Detox OSS',
        project: 'Detox OSS',
        images: [imageUrl]
      });

      const generatedText = response.data.generatedTexts[0];
      if (!generatedText) {
        throw new Error('Failed to generate text, got response:', response.data);
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
