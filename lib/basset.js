const fs = require('fs');
const path = require('path');

const { Client } = require('./client');
const { getGitInfo } = require('./git');
const { generateFileHash, generateHash } = require('./generate-hash');
const { getAssets } = require('./assets');

class Basset {
  constructor(token, staticDir, bassetUrl, {baseUrl = '', ignoreExtensions = '', type = 'web'}) {
    this.token = token;
    this.staticDir = staticDir;
    this.baseUrl = baseUrl;
    this.client = new Client(bassetUrl, token);
    this.ignoreExtensions = ignoreExtensions.split(',').map(e => e.trim()).filter(e => e !== '');
    this.type = type;
  }

  async buildStart(compareBranch=null) {
    const currentAssets = await this.getAssets();
    const gitInfo = await getGitInfo();
    const { assets } = await this.client.buildStart({
      ...gitInfo,
      compareBranch,
      assets: currentAssets,
    });
    if (this.type === 'web') {
      await this.uploadAssets(assets);
    }
  }

  async buildFinish() {
    if (!this.client.buildId) {
      throw new Error('There is no build to finish');
    }
    return this.client.buildFinish();
  }

  async getAssets() {
    if (this.type === 'image') {
      return [];
    }
    return getAssets(this.staticDir, this.baseUrl, this.ignoreExtensions);
  }

  async uploadAssets(assets) {
    if (!this.client.buildId) {
      throw new Error('You cannot upload assets without starting a build');
    }
    for (const [filePath, sha] of Object.entries(assets)) {
      const relativePath = path.join(this.baseUrl, filePath);
      const fileStream = fs.createReadStream(
        path.join(this.staticDir, filePath),
      );

      await this.client.uploadAsset(relativePath, sha, fileStream);
    }
  }

  async uploadSnapshotSource(snapshot, source) {
    if (this.type !== 'web') {
      throw new Error('Only projects that are type web can upload snapshots');
    }
    if (!this.client.buildId) {
      throw new Error('You cannot upload snapshots without starting a build');
    }
    const sha = generateHash(source);
    const relativePath = `${snapshot.title}.html`; // snapshots are treated as they are in the root path
    await this.client.uploadSnapshot(snapshot, relativePath, sha, source);
  }

  async uploadSnapshotFile(snapshot, filePath) {
    if (this.type !== 'web') {
      throw new Error('Only projects that are type web can upload snapshots');
    }
    if (!this.client.buildId) {
      throw new Error('You cannot upload snapshots without starting a build');
    }
    const sha = await generateFileHash(filePath);
    const relativePath = `${snapshot.title}.html`; // snapshots are treated as they are in the root path
    const file = fs.createReadStream(filePath);
    await this.client.uploadSnapshot(snapshot, relativePath, sha, file);
  }

  async uploadImageFile({ title }, filePath) {
    if (!this.type !== 'image') {
      throw new Error('Only projects that are type image can upload screenshots');
    }
    if (!this.client.buildId) {
      throw new Error('You cannot upload screenshots without starting a build');
    }
    const sha = await generateFileHash(filePath);
    const file = fs.createReadStream(filePath);
    await this.client.uploadImage({ title, }, sha, file);
  }
}

module.exports = Basset;
