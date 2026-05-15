import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
const requiredFiles = ["index.html", "styles.css", "app.js", "README.md"];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) throw new Error(`Missing required file: ${file}`);
}

if (existsSync(dist)) rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const file of requiredFiles) {
  copyFileSync(join(root, file), join(dist, file));
}

const files = readdirSync(dist).filter((file) => statSync(join(dist, file)).isFile());
console.log(`Built ${files.length} files into dist/`);
