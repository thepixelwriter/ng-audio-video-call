import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const rootPackagePath = path.join(rootDir, 'package.json');
const libraryPackagePath = path.join(rootDir, 'projects', 'ng-audio-video-call', 'package.json');

const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
const libraryPackage = JSON.parse(fs.readFileSync(libraryPackagePath, 'utf8'));

if (libraryPackage.version !== rootPackage.version) {
  libraryPackage.version = rootPackage.version;
  fs.writeFileSync(libraryPackagePath, `${JSON.stringify(libraryPackage, null, 2)}\n`);
  console.log(`Synced library package version to ${rootPackage.version}`);
} else {
  console.log(`Library package version already matches ${rootPackage.version}`);
}
