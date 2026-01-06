const fs = require('fs');

const expectedVersion = process.argv[2];

if (!expectedVersion) {
  console.log('No version provided to check. Skipping.');
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const cff = fs.readFileSync('CITATION.cff', 'utf-8');

const cffVersionMatch = cff.match(/^version: (.*)$/m);
const cffVersion = cffVersionMatch ? cffVersionMatch[1].trim() : null;

let hasError = false;

if (pkg.version !== expectedVersion) {
  console.error(`package.json version (${pkg.version}) does not match tag (${expectedVersion})`);
  hasError = true;
}

if (cffVersion !== expectedVersion) {
  console.error(`CITATION.cff version (${cffVersion}) does not match tag (${expectedVersion})`);
  hasError = true;
}

if (pkg.version !== cffVersion) {
  console.error(`Version mismatch between files: package.json (${pkg.version}) vs CITATION.cff (${cffVersion})`);
  hasError = true;
}

if (hasError) {
  process.exit(1);
}

console.log(`Versions match tag ${expectedVersion}`);