/**
 * @file scripts/patchTfjsNode.js
 * @description Patches @tensorflow/tfjs-node to remove Node 24-incompatible util.isNullOrUndefined calls.
 *              Node.js v24 removed the long-deprecated util.isNullOrUndefined function,
 *              but tfjs-node 4.22.0 still calls it in nodejs_kernel_backend.js.
 * @usage Runs from backend/package.json postinstall and can be executed manually with `node scripts/patchTfjsNode.js`.
 * @connects backend/package.json, node_modules/@tensorflow/tfjs-node/dist/nodejs_kernel_backend.js
 */
const fs = require('fs');
const path = require('path');
const { logInfo, logWarn } = require('../app/logger');

const targetPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@tensorflow',
  'tfjs-node',
  'dist',
  'nodejs_kernel_backend.js'
);

const replacements = [
  {
    from: '    if ((0, util_1.isNullOrUndefined)(tensorsOrDtype)) {\n        throw new Error(\'Invalid input tensors value.\');',
    to:   '    if (tensorsOrDtype == null) {\n        throw new Error(\'Invalid input tensors value.\');',
  },
  {
    from: '    if ((0, util_1.isNullOrUndefined)(tensorsOrDtype)) {\n        throw new Error(\'Invalid input tensors value: \' + tensorsOrDtype);',
    to:   '    if (tensorsOrDtype == null) {\n        throw new Error(\'Invalid input tensors value: \' + tensorsOrDtype);',
  },
  {
    from: '    if ((0, util_1.isNullOrUndefined)(tensors)) {',
    to:   '    if (tensors == null) {',
  },
];

function patchTfjsNode() {
  if (!fs.existsSync(targetPath)) {
    logWarn('postinstall.tfjsNode', 'tfjs-node nodejs_kernel_backend.js not found; skipping patch');
    return;
  }

  let content = fs.readFileSync(targetPath, 'utf8');

  const alreadyPatched = !content.includes('util_1.isNullOrUndefined');
  if (alreadyPatched) {
    logInfo('postinstall.tfjsNode', 'Patch already applied');
    return;
  }

  content = content.replace(/\(0, util_1\.isNullOrUndefined\)\(([^)]+)\)/g, '($1 == null)');

  fs.writeFileSync(targetPath, content, 'utf8');
  logInfo('postinstall.tfjsNode', 'Patched tfjs-node for Node 24 util.isNullOrUndefined removal');
}

patchTfjsNode();
