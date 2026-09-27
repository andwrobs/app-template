// @vitest-environment node
import { spawnSync } from "node:child_process";
import {
	existsSync,
	lstatSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	readlinkSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { main } from "./create-react-spa.mjs";

const templateRoot = path.resolve(import.meta.dirname, "..");
// The starter's "Keep apps clean" pattern: no starter tracking in apps.
const starterOnly =
	/maintainers\/|template-(task|maintenance)|status\.md|backlog|Filebonsai|(UI|DEMO|QUALITY|MAINT|DIST|API|APP|AGENT)-0[0-9]/;

let workspace;
let output;
const io = {
	log: (line) => output.push(line),
	error: (line) => output.push(line),
};
const create = (...args) => main([...args, "--no-install"], io);
const read = (app, file) => readFileSync(path.join(app, file), "utf8");

function allFiles(directory) {
	return readdirSync(directory, { recursive: true, withFileTypes: true })
		.filter((entry) => entry.isFile())
		.map((entry) => path.join(entry.parentPath, entry.name));
}

beforeEach(() => {
	workspace = mkdtempSync(path.join(tmpdir(), "create-react-spa-"));
	output = [];
});

afterEach(() => {
	rmSync(workspace, { recursive: true, force: true });
});

it("prints help and refuses bad input without copying anything", () => {
	expect(main(["--help"], io)).toBe(0);
	expect(output.join("\n")).toMatch(/^Usage:/);

	expect(main([], io)).toBe(1);
	expect(main(["--nope", "x"], io)).toBe(1);
	expect(create(path.join(workspace, "Bad Name"))).toBe(1);
	expect(create(path.join(templateRoot, "nested-app"))).toBe(1);
	expect(existsSync(path.join(templateRoot, "nested-app"))).toBe(false);

	const occupied = path.join(workspace, "occupied");
	mkdirSync(occupied);
	writeFileSync(path.join(occupied, "keep.txt"), "mine");
	expect(create(occupied)).toBe(1);
	expect(readdirSync(occupied)).toEqual(["keep.txt"]);
});

it("copies an app with its agent files and none of the starter's tracking", () => {
	const app = path.join(workspace, "my-app");
	expect(create(app)).toBe(0);

	for (const kept of [
		".env.example",
		"AGENTS.md",
		"CLAUDE.md",
		".codex/README.md",
		".github/workflows/verify.yml",
		".agents/skills/react-router/SKILL.md",
		"src/routes/examples/routes.ts",
		"public/demo/tasks.json",
	]) {
		expect(existsSync(path.join(app, kept)), kept).toBe(true);
	}
	for (const left of ["maintainers", "bin", "node_modules", "build", ".git"]) {
		expect(existsSync(path.join(app, left)), left).toBe(false);
	}
	expect(readdirSync(path.join(app, ".agents/skills"))).toEqual([
		"react-router",
	]);
	expect(lstatSync(path.join(app, ".claude/skills")).isSymbolicLink()).toBe(
		true,
	);
	expect(readlinkSync(path.join(app, ".claude/skills"))).toBe(
		"../.agents/skills",
	);

	const manifest = JSON.parse(read(app, "package.json"));
	expect(manifest).toMatchObject({
		name: "my-app",
		version: "0.1.0",
		template: { name: "react-router-spa-template" },
	});
	expect(manifest.description).toBeUndefined();
	const lock = JSON.parse(read(app, "package-lock.json"));
	expect([lock.name, lock.packages[""].name]).toEqual(["my-app", "my-app"]);

	const readme = read(app, "README.md");
	expect(readme.startsWith("# my-app\n")).toBe(true);
	expect(readme).not.toContain("Create an app from this starter");

	const leaks = allFiles(app).filter((file) =>
		starterOnly.test(readFileSync(file, "utf8")),
	);
	expect(leaks).toEqual([]);
});

it("leaves out the examples and every reference to them", () => {
	const app = path.join(workspace, "plain-app");
	expect(create(app, "--no-examples", "--name", "plain")).toBe(0);

	expect(existsSync(path.join(app, "src/routes/examples"))).toBe(false);
	expect(existsSync(path.join(app, "public/demo"))).toBe(false);
	const references = allFiles(app)
		.filter((file) => !file.endsWith("package-lock.json"))
		.filter((file) =>
			/examples\/|exampleRoutes/.test(readFileSync(file, "utf8")),
		);
	expect(references).toEqual([]);
	expect(JSON.parse(read(app, "package.json")).name).toBe("plain");

	const biome = spawnSync(
		path.join(templateRoot, "node_modules/.bin/biome"),
		["check", "."],
		{ cwd: app, encoding: "utf8" },
	);
	expect(biome.status, biome.stdout + biome.stderr).toBe(0);
});
