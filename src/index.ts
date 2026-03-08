import * as p from "@clack/prompts";
import fs from "fs";
import path from "path";
import { detectProject } from "./detector.js";
import {
  promptAuthor,
  promptContributors,
  promptDescription,
  promptDocker,
  promptEnvVars,
  promptLicense,
  promptUsage,
  promptWithCancel,
} from "./prompts.js";
import type { TemplateData } from "./template.js";
import {
  buildTableOfContents,
  detectMissingFields,
  fillTemplate,
  loadTemplate,
} from "./template.js";

async function main() {
  p.intro("📝 README Generator");

  const projectPath = process.argv[2] ?? process.cwd();
  p.log.info(`Reading project at: ${projectPath}`);

  const info = detectProject(projectPath);

  const allDeps = { ...info.dependencies, ...info.devDependencies };
  const techList = Object.keys(allDeps)
    .map((dep) => `* [${dep}](https://npmjs.com/package/${dep})`)
    .join("\n");

  const description = await promptDescription(info);
  const { author, githubUser } = await promptAuthor(info);
  const { hasDocker, dockerPort } = await promptDocker(info);
  const envVars = await promptEnvVars(info);
  const contributorsTable = await promptContributors();
  const license = await promptLicense(info);
  const usageCommand = await promptUsage(info);

  const licenseBadge = license
    ? `![License](https://img.shields.io/static/v1?label=License&message=${encodeURIComponent(license)}&color=0000ff&style=for-the-badge)`
    : undefined;

  const tableOfContents = buildTableOfContents({
    env_vars: envVars,
    has_docker: hasDocker,
    contributors_table: contributorsTable,
    license,
    author,
    usage_command: usageCommand,
  });

  const data: TemplateData = {
    ...info,
    project_name: info.name,
    tech_list: techList,
    description,
    author,
    github_user: githubUser,
    env_vars: envVars,
    has_docker: hasDocker,
    docker_port: dockerPort,
    contributors_table: contributorsTable,
    license,
    license_badge: licenseBadge,
    usage_command: usageCommand,
    table_of_contents: tableOfContents,
  };

  const templatePath = process.argv[3];
  const template = loadTemplate(templatePath);

  const missing = detectMissingFields(template, data);
  const extras: Record<string, string> = {};

  if (missing.length > 0) {
    p.log.warn("Some fields were not detected automatically:");

    for (const field of missing) {
      const value = await promptWithCancel(
        p.text({ message: `What is the value of "${field}"?`, placeholder: field }),
      );
      extras[field] = value;
    }
  }

  const readme = fillTemplate(template, data, extras);
  const outputPath = path.join(projectPath, "README.md");
  fs.writeFileSync(outputPath, readme);

  p.outro(`✅ README.md generated at ${outputPath}`);
}

main();
