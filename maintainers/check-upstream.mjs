#!/usr/bin/env node
// Reports what changed upstream since the starter last took it: copied registry
// components, new registry components, the React Router skill's source release,
// and npm packages. Read-only: it never touches tracked files. With --save it
// writes the report to maintainers/reports/upstream-<date>.md.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const registry = "https://ui.shadcn.com/r/styles/aria-nova";
// Names the docs list with no aria-nova item, or that are deliberately left out.
// See the Coverage paragraph in ui-inventory.md.
const knownGaps = new Set([
	"drawer",
	"data-table",
	"date-picker",
	"menubar",
	"navigation-menu",
	"toast",
	"typography",
]);

export function readInventory(markdown) {
	return [...markdown.matchAll(/^\| ([a-z-]+) \| `([0-9a-f]{16})` \|/gm)].map(
		([, name, hash]) => ({ name, hash }),
	);
}

async function fetchText(url, fetchImpl) {
	try {
		const response = await fetchImpl(url, {
			signal: AbortSignal.timeout(15_000),
		});
		if (!response.ok) return { error: `HTTP ${response.status}` };
		return { text: await response.text() };
	} catch (error) {
		return { error: error instanceof Error ? error.message : String(error) };
	}
}

const shortHash = (text) =>
	createHash("sha256").update(text).digest("hex").slice(0, 16);

export async function checkComponents(items, fetchImpl = fetch) {
	return Promise.all(
		items.map(async ({ name, hash }) => {
			const { text, error } = await fetchText(
				`${registry}/${name}.json`,
				fetchImpl,
			);
			if (error) return { name, status: "unavailable", detail: error };
			const latest = shortHash(text);
			return latest === hash
				? { name, status: "unchanged" }
				: { name, status: "changed", detail: `${hash} → ${latest}` };
		}),
	);
}

export async function findNewComponents(known, fetchImpl = fetch) {
	const { text, error } = await fetchText(
		"https://ui.shadcn.com/llms.txt",
		fetchImpl,
	);
	if (error) return { error };
	const names = new Set(
		[...text.matchAll(/docs\/components\/([a-z0-9-]+)/g)].map(([, n]) => n),
	);
	const candidates = [...names].filter(
		(name) => !known.has(name) && !knownGaps.has(name),
	);
	const probes = await Promise.all(
		candidates.map(async (name) => ({
			name,
			...(await fetchText(`${registry}/${name}.json`, fetchImpl)),
		})),
	);
	return { names: probes.filter((probe) => probe.text).map((p) => p.name) };
}

export async function checkRouterSkill(recorded, fetchImpl = fetch) {
	const { text, error } = await fetchText(
		"https://registry.npmjs.org/create-react-router/latest",
		fetchImpl,
	);
	if (error) return { status: "unavailable", detail: error };
	const latest = JSON.parse(text).version;
	return latest === recorded
		? { status: "unchanged", detail: recorded }
		: { status: "changed", detail: `${recorded} → ${latest}` };
}

export async function checkPackages(manifest, lock, fetchImpl = fetch) {
	const names = Object.keys({
		...manifest.dependencies,
		...manifest.devDependencies,
	});
	const results = await Promise.all(
		names.map(async (name) => {
			const locked = lock.packages[`node_modules/${name}`]?.version;
			const { text, error } = await fetchText(
				`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`,
				fetchImpl,
			);
			if (error) return { name, locked, status: "unavailable", detail: error };
			const latest = JSON.parse(text).version;
			return latest === locked
				? { name, locked, status: "unchanged" }
				: { name, locked, status: "changed", detail: `${locked} → ${latest}` };
		}),
	);
	return results.sort((a, b) => a.name.localeCompare(b.name));
}

export function renderReport({ date, components, added, skill, packages }) {
	const lines = [`# Upstream report, ${date}`, ""];
	const section = (title, rows) => {
		lines.push(`## ${title}`, "");
		const flagged = rows.filter((row) => row.status !== "unchanged");
		if (flagged.length === 0) lines.push("No changes.", "");
		for (const row of flagged) {
			lines.push(
				`- ${row.status}: ${row.name}${row.detail ? ` (${row.detail})` : ""}`,
			);
		}
		if (flagged.length) lines.push("");
		lines.push(
			`${rows.length - flagged.length} of ${rows.length} unchanged.`,
			"",
		);
	};
	section("Registry components (hash vs inventory)", components);
	lines.push("## New registry components", "");
	if (added.error) lines.push(`unavailable: ${added.error}`, "");
	else if (added.names.length === 0) lines.push("None.", "");
	else for (const name of added.names) lines.push(`- new: ${name}`);
	if (added.names?.length) lines.push("");
	lines.push(
		"## React Router skill source (create-react-router)",
		"",
		`${skill.status}: ${skill.detail}`,
		"",
	);
	section("npm packages (locked vs latest)", packages);
	return lines.join("\n");
}

export async function main(argv = process.argv.slice(2), fetchImpl = fetch) {
	const read = (file) => readFileSync(path.join(root, file), "utf8");
	const inventory = readInventory(read("maintainers/ui-inventory.md"));
	const recorded = /create-react-router@([\d.]+)/.exec(
		read(".agents/skills/react-router/references/upstream.md"),
	)?.[1];
	const [components, added, skill, packages] = await Promise.all([
		checkComponents(inventory, fetchImpl),
		findNewComponents(
			new Set([...inventory.map((item) => item.name), "text-field"]),
			fetchImpl,
		),
		checkRouterSkill(recorded, fetchImpl),
		checkPackages(
			JSON.parse(read("package.json")),
			JSON.parse(read("package-lock.json")),
			fetchImpl,
		),
	]);
	const date = new Date().toISOString().slice(0, 10);
	const report = renderReport({ date, components, added, skill, packages });
	console.log(report);
	if (argv.includes("--save")) {
		const directory = path.join(root, "maintainers/reports");
		mkdirSync(directory, { recursive: true });
		let file = path.join(directory, `upstream-${date}.md`);
		for (let n = 2; existsSync(file); n++) {
			file = path.join(directory, `upstream-${date}-${n}.md`);
		}
		writeFileSync(file, `${report}\n`);
		console.log(`Saved ${path.relative(root, file)}`);
	}
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
	await main();
}
