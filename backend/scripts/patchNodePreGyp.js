/**
 * @file scripts/patchNodePreGyp.js
 * @description Patches node-pre-gyp to avoid Node 24 DEP0169 warnings from legacy url.parse/url.resolve usage.
 * @usage Runs from backend/package.json postinstall and can be executed manually with `node scripts/patchNodePreGyp.js`.
 * @connects backend/package.json, node_modules/@mapbox/node-pre-gyp/lib/util/versioning.js
 * @doc docs/04-visual-factory.md
 */
const fs = require('fs');
const path = require('path');
const { logInfo, logWarn } = require('../app/logger');

const versioningPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@mapbox',
  'node-pre-gyp',
  'lib',
  'util',
  'versioning.js'
);

const replacements = [
  {
    from: "const url = require('url');",
    to: "const { URL } = require('url');",
  },
  {
    from: "const protocol = url.parse(o.host).protocol;",
    to: "const protocol = new URL(o.host).protocol;",
  },
  {
    from: "opts.hosted_path = url.resolve(opts.host, opts.remote_path);",
    to: "opts.hosted_path = new URL(opts.remote_path || '', opts.host).toString();",
  },
  {
    from: "opts.hosted_tarball = url.resolve(opts.hosted_path, opts.package_name);",
    to: "opts.hosted_tarball = new URL(opts.package_name, opts.hosted_path).toString();",
  },
];

function patchNodePreGyp() {
  if (!fs.existsSync(versioningPath)) {
    logWarn('postinstall.nodePreGyp', 'node-pre-gyp versioning.js not found; skipping patch');
    return;
  }

  const original = fs.readFileSync(versioningPath, 'utf8');
  const alreadyPatched = replacements.every((replacement) => original.includes(replacement.to));

  if (alreadyPatched) {
    logInfo('postinstall.nodePreGyp', 'Patch already applied');
    return;
  }

  const missingLegacyTargets = replacements.filter((replacement) => !original.includes(replacement.from));
  if (missingLegacyTargets.length > 0) {
    logWarn('postinstall.nodePreGyp', 'Patch target changed; skipping automatic patch', { missingTargets: missingLegacyTargets.length });
    return;
  }

  let patched = original;

  for (const replacement of replacements) {
    patched = patched.replace(replacement.from, replacement.to);
  }

  fs.writeFileSync(versioningPath, patched, 'utf8');
  logInfo('postinstall.nodePreGyp', 'Patched node-pre-gyp for Node 24 URL compatibility');
}

patchNodePreGyp();
