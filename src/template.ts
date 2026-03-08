import fs from "fs";
import path from "path";
import type { ProjectInfo } from "./detector.js";

export interface TemplateData extends ProjectInfo {
  tech_list?: string;
  project_name?: string;
  env_vars?: string;
  has_docker?: string;
  docker_port?: string;
  github_user?: string;
  contributors_table?: string;
  license_badge?: string;
  table_of_contents?: string;
  usage_command?: string;
}

export function loadTemplate(templatePath?: string): string {
  const defaultPath = path.resolve("templates/default.md");
  const filePath = templatePath ?? defaultPath;
  return fs.readFileSync(filePath, "utf-8");
}

export function buildContributorsTable(input: string): string {
  const contributors = input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, user] = line.split("--");
      return { name: name?.trim(), user: user?.trim() };
    })
    .filter((c) => c.name && c.user);

  const rows: string[] = [];
  const chunkSize = 3;

  for (let i = 0; i < contributors.length; i += chunkSize) {
    const chunk = contributors.slice(i, i + chunkSize);

    const cells = chunk
      .map(
        (c) => `
    <td align="center">
      <a href="https://github.com/${c.user}">
        <img src="https://avatars.githubusercontent.com/${c.user}" width="100px;" alt="${c.name}"/><br>
        <sub><b>${c.name}</b></sub>
      </a>
    </td>`,
      )
      .join("");

    rows.push(`  <tr>${cells}\n  </tr>`);
  }

  return `<table>\n${rows.join("\n")}\n</table>`;
}

export function fillTemplate(
  template: string,
  data: TemplateData,
  extras: Record<string, string> = {},
): string {
  const allData: Record<string, unknown> = { ...data, ...extras };
  let result = template;

  for (const [key, value] of Object.entries(allData)) {
    if (typeof value === "string") {
      result = result.replaceAll(`{{${key}}}`, value);
    }
  }

  result = result.replace(
    /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key, block) => {
      return allData[key] ? block : "";
    },
  );

  return result;
}

export function detectMissingFields(
  template: string,
  data: TemplateData,
): string[] {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g);
  const missing: string[] = [];

  for (const match of matches) {
    const key = match[1];
    if (
      key !== undefined &&
      key !== "if" &&
      !(key in data) &&
      !missing.includes(key)
    ) {
      missing.push(key);
    }
  }

  return missing;
}

export function buildTableOfContents(data: TemplateData): string {
  const lines: string[] = [];

  lines.push("* [About the Project](#book-about-the-project)");
  if (data.usage_command) lines.push("  * [Usage](#coffee-usage)");
  lines.push("  * [Technologies](#computer-technologies)");
  lines.push("* [Installation](#bricks-installation)");
  lines.push("  * [Prerequisites](#construction-prerequisites)");
  lines.push(
    "  * [Installing Dependencies](#construction-installing-dependencies)",
  );
  if (data.env_vars)
    lines.push("  * [Environment Variables](#wrench-environment-variables)");
  if (data.has_docker)
    lines.push("  * [Running with Docker](#whale-running-with-docker)");
  lines.push("  * [Running](#arrow_forward-running)");
  lines.push("* [Contributing](#handshake-contributing)");
  if (data.contributors_table) lines.push("* [Contributors](#contributors)");
  if (data.license) lines.push("* [License](#page_facing_up-license)");
  if (data.author) lines.push("* [Author](#technologist-author)");

  return lines.join("\n");
}
