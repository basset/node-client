const fs = require('fs');
const path = require('path');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

const { generateFileHash } = require('./generate-hash');

const getAssets = (staticDir, relativeDir, ignoreExtensions) => {
  return walk(staticDir, relativeDir, ignoreExtensions);
};

const walk = async (staticDir, relativeDir, ignoreExtensions) => {
  const dir = path.join(process.cwd(), staticDir, relativeDir);
  let assets = {};
  const files = await readdir(dir);
  const filteredFilters = files.filter(
    f => !ignoreExtensions.includes(path.extname(f)),
  );
  for (const file of filteredFilters) {
    const filePath = path.join(dir, file);
    const fileState = await stat(filePath);
    if (fileState.isDirectory()) {
      const subAssets = await walk(
        staticDir,
        path.join(relativeDir, file),
        ignoreExtensions
      );
      assets = {
        ...assets,
        ...subAssets,
      };
      continue;
    }

    const sha = await generateFileHash(filePath);
    const relativePath = path.join(relativeDir, file);
    assets[relativePath] = sha;
  }
  return assets;
};

module.exports = {
  getAssets,
  walk,
};
