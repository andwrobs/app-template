#!/usr/bin/env node
// Creates an app from this starter. No dependencies; Node 22.22 or later.
import { spawnSync } from "node:child_process";
import {
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const templateRoot = path.resolve(import.meta.dirname, "..");

// An allowlist: anything not named here (starter tracking, this CLI, build
// output, caches, node_modules, .git, env files, other skills) stays behind.
const files = [
	".env.example",
	".gitignore",
	".npmrc",
	".nvmrc",
	"AGENTS.md",
	"CLAUDE.md",
	"README.md",
	"biome.json",
	"components.json",
	"lefthook.yml",
	"package-lock.json",
	"package.json",
	"react-router.config.ts",
	"tsconfig.json",
	"vite.config.ts",
	"vitest-setup.ts",
];
const directories = [
	".agents/skills/new-route",
	".agents/skills/react-router",
	".codex",
	".github",
	"docs",
	"public",
	"scripts",
	"src",
	"test-utils",
];
const skipped = (name) => name === ".DS_Store" || name.startsWith(".env");

// --no-examples: folders to delete, files whose example lines go, and docs
// whose "## Examples" section goes.
const exampleFolders = ["src/routes/examples", "public/demo"];
const exampleLineFiles = [
	"src/routes.ts",
	"src/services.ts",
	"src/lib/app/nav.ts",
	"src/routes/home/home.route.tsx",
];
const exampleLine = /\/examples\/|exampleRoutes|demoApi|createDemo/;
const exampleSectionFiles = [
	"README.md",
	"docs/code-organization.md",
	"docs/data-and-forms.md",
	"docs/services-and-state.md",
];

const usage = `Usage: node bin/create-react-spa.mjs <directory> [options]

Creates an app from this starter in <directory>, which must be empty or not exist.

Options:
  --name <name>    package name (default: the directory name)
  --no-examples    leave out the example routes and fixtures
  --no-install     skip npm ci
  --offline        run npm ci --offline, using only the npm cache
  -h, --help       show this help`;

const validName = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

export function main(argv, { log = console.log, error = console.error } = {}) {
	let parsed;
	try {
		parsed = parseArgs({
			args: argv,
			allowPositionals: true,
			allowNegative: true,
			options: {
				name: { type: "string" },
				examples: { type: "boolean", default: true },
				install: { type: "boolean", default: true },
				offline: { type: "boolean", default: false },
				help: { type: "boolean", short: "h", default: false },
			},
		});
	} catch (problem) {
		error(`${problem.message}\n\n${usage}`);
		return 1;
	}
	const { values, positionals } = parsed;
	if (values.help) {
		log(usage);
		return 0;
	}
	if (positionals.length !== 1) {
		error(`Give exactly one destination directory.\n\n${usage}`);
		return 1;
	}

	const destination = path.resolve(positionals[0]);
	const name = values.name ?? path.basename(destination);
	if (name.length > 214 || !validName.test(name)) {
		error(
			`"${name}" isn't a valid package name. Use lowercase letters, digits, and - . _ ~, or pass --name.`,
		);
		return 1;
	}
	const fromTemplate = path.relative(templateRoot, destination);
	if (!fromTemplate.startsWith("..") && !path.isAbsolute(fromTemplate)) {
		error("Create the app outside the starter folder.");
		return 1;
	}
	if (existsSync(destination)) {
		if (!statSync(destination).isDirectory()) {
			error(`${destination} exists and isn't a directory.`);
			return 1;
		}
		if (readdirSync(destination).length > 0) {
			error(`${destination} isn't empty. Nothing was copied.`);
			return 1;
		}
	}

	const template = readJson(path.join(templateRoot, "package.json"));
	copyApp(destination);
	renamePackage(destination, name, {
		name: template.name,
		version: template.version,
		commit: templateCommit(),
	});
	retitleReadme(destination, name);
	if (!values.examples) removeExamples(destination, { log });

	log(`Created ${name} in ${destination}.`);
	if (values.install) {
		const install = spawnSync(
			"npm",
			["ci", ...(values.offline ? ["--offline"] : [])],
			{ cwd: destination, stdio: "inherit" },
		);
		if (install.status !== 0) {
			error(`npm ci failed. Fix the cause, then run npm ci in ${destination}.`);
			return 1;
		}
	}
	const relative = path.relative(process.cwd(), destination);
	log(
		`\nNext:\n  cd ${relative.startsWith("..") ? destination : relative || "."}`,
	);
	if (!values.install) log("  npm ci");
	log("  npm test\n  npm run dev");
	return 0;
}

function copyApp(destination) {
	mkdirSync(destination, { recursive: true });
	for (const file of files) {
		cpSync(path.join(templateRoot, file), path.join(destination, file));
	}
	for (const directory of directories) {
		cpSync(
			path.join(templateRoot, directory),
			path.join(destination, directory),
			{
				recursive: true,
				verbatimSymlinks: true,
				filter: (source) => !skipped(path.basename(source)),
			},
		);
	}
	// Claude reads skills through .claude/skills; Codex and others read .agents.
	mkdirSync(path.join(destination, ".claude"));
	symlinkSync("../.agents/skills", path.join(destination, ".claude/skills"));
}

function renamePackage(destination, name, template) {
	const packagePath = path.join(destination, "package.json");
	const manifest = readJson(packagePath);
	manifest.name = name;
	manifest.version = "0.1.0";
	delete manifest.description;
	manifest.template = template;
	writeJson(packagePath, manifest);

	const lockPath = path.join(destination, "package-lock.json");
	const lock = readJson(lockPath);
	lock.name = name;
	lock.version = "0.1.0";
	lock.packages[""].name = name;
	lock.packages[""].version = "0.1.0";
	writeJson(lockPath, lock);
}

function retitleReadme(destination, name) {
	const readmePath = path.join(destination, "README.md");
	const readme = readFileSync(readmePath, "utf8").replace(/^# .*/, `# ${name}`);
	writeFileSync(
		readmePath,
		removeSection(readme, "## Create an app from this starter"),
	);
}

function removeExamples(destination, { log }) {
	for (const folder of exampleFolders) {
		rmSync(path.join(destination, folder), { recursive: true, force: true });
	}
	for (const file of exampleLineFiles) {
		const filePath = path.join(destination, file);
		const kept = readFileSync(filePath, "utf8")
			.split("\n")
			.filter((line) => !exampleLine.test(line));
		writeFileSync(filePath, kept.join("\n"));
	}
	for (const file of exampleSectionFiles) {
		const filePath = path.join(destination, file);
		writeFileSync(
			filePath,
			removeSection(readFileSync(filePath, "utf8"), "## Examples"),
		);
	}
	// Removing lines can leave unused imports and code the formatter would reflow.
	const biome = path.join(templateRoot, "node_modules/.bin/biome");
	if (existsSync(biome)) {
		spawnSync(biome, ["check", "--write", "--unsafe", ...exampleLineFiles], {
			cwd: destination,
			stdio: "ignore",
		});
	} else {
		log("Run npm run fix in the app; the starter's Biome isn't installed.");
	}
}

// Removes a "## " section through the next "## " heading or the end of file.
function removeSection(markdown, heading) {
	const start = markdown.indexOf(`${heading}\n`);
	if (start === -1) return markdown;
	const next = markdown.indexOf("\n## ", start + heading.length);
	const rest = next === -1 ? "" : markdown.slice(next + 1);
	return `${markdown.slice(0, start).trimEnd()}\n${rest ? `\n${rest}` : ""}`;
}

function templateCommit() {
	const git = (args) =>
		spawnSync("git", args, { cwd: templateRoot, encoding: "utf8" });
	const head = git(["rev-parse", "--short", "HEAD"]);
	if (head.status !== 0) return null;
	const dirty = git(["status", "--porcelain"]).stdout.trim() !== "";
	return `${head.stdout.trim()}${dirty ? "-dirty" : ""}`;
}

function readJson(file) {
	return JSON.parse(readFileSync(file, "utf8"));
}

// Keeps the file's own indentation so npm and Biome leave it alone.
function writeJson(file, value) {
	const indent = /\n(\s+)"/.exec(readFileSync(file, "utf8"))?.[1] ?? "\t";
	writeFileSync(file, `${JSON.stringify(value, null, indent)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
	process.exitCode = main(process.argv.slice(2));
}
