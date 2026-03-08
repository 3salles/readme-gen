import * as p from "@clack/prompts";
import fs from "fs";
import path from "path";
import { detectProject, type ProjectInfo } from "./detector.js";
import type { TemplateData } from "./template.js";
import {
  buildContributorsTable,
  buildTableOfContents,
  detectMissingFields,
  fillTemplate,
  loadTemplate,
} from "./template.js";

async function promptWithCancel<T>(promise: Promise<T | symbol>): Promise<T> {
  const result = await promise;
  if (p.isCancel(result)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }
  return result as T;
}

async function promptDescription(info: ProjectInfo): Promise<string> {
  if (info.description) {
    const useDetected = await promptWithCancel(
      p.confirm({ message: `Detected description: "${info.description}". Use it?` }),
    );
    if (useDetected) return info.description;
  }

  return promptWithCancel(
    p.text({
      message: "Write the project description:",
      placeholder: "An amazing project that does...",
      validate: (v) =>
        !v || v.trim() === "" ? "Description cannot be empty." : undefined,
    }),
  );
}

async function promptAuthor(
  info: ProjectInfo,
): Promise<{ author: string | undefined; githubUser: string | undefined }> {
  const showAuthor = await promptWithCancel(
    p.confirm({ message: "Display author in the README?" }),
  );
  if (!showAuthor) return { author: undefined, githubUser: undefined };

  let author: string | undefined = info.author;
  let githubUser: string | undefined = info.githubUser;

  if (author) {
    const useDetected = await promptWithCancel(
      p.confirm({ message: `Detected author: "${author}". Use it?` }),
    );
    if (!useDetected) {
      author = undefined;
      githubUser = undefined;
    }
  }

  if (!author) {
    author = await promptWithCancel(
      p.text({
        message: "What is your name?",
        placeholder: "Beatriz Salles",
        validate: (v) =>
          !v || v.trim() === "" ? "Author cannot be empty." : undefined,
      }),
    );
  }

  if (githubUser) {
    const useDetected = await promptWithCancel(
      p.confirm({ message: `Detected GitHub user: "${githubUser}". Use it?` }),
    );
    if (!useDetected) githubUser = undefined;
  }

  if (!githubUser) {
    githubUser = await promptWithCancel(
      p.text({
        message: "What is your GitHub username?",
        placeholder: "your-username",
        validate: (v) =>
          !v || v.trim() === "" ? "Username cannot be empty." : undefined,
      }),
    );
  }

  return { author, githubUser };
}

async function promptDocker(
  info: ProjectInfo,
): Promise<{ hasDocker: string | undefined; dockerPort: string | undefined }> {
  const showDocker = await promptWithCancel(
    p.confirm({ message: "Display Docker section?" }),
  );
  if (!showDocker) return { hasDocker: undefined, dockerPort: undefined };

  if (info.hasDocker) {
    p.log.success(
      `Dockerfile detected! Port: ${info.dockerPort ?? "not found"}`,
    );
    if (info.dockerPort) return { hasDocker: "true", dockerPort: info.dockerPort };
  }

  const dockerPort = await promptWithCancel(
    p.text({
      message: "What is the application port?",
      placeholder: "3000",
      validate: (v) =>
        !v || v.trim() === "" ? "Port cannot be empty." : undefined,
    }),
  );

  return { hasDocker: "true", dockerPort };
}

async function promptEnvVars(info: ProjectInfo): Promise<string | undefined> {
  const showEnvVars = await promptWithCancel(
    p.confirm({ message: "Display environment variables section?" }),
  );
  if (!showEnvVars) return undefined;

  if (info.envVars && info.envVars.length > 0) {
    p.log.success(`Detected variables: ${info.envVars.join(", ")}`);
    return info.envVars.join("\n");
  }

  const written = await promptWithCancel(
    p.text({
      message: "List environment variables (comma-separated):",
      placeholder: "DATABASE_URL, API_KEY, PORT",
      validate: (v) =>
        !v || v.trim() === "" ? "Enter at least one variable." : undefined,
    }),
  );

  return written
    .split(",")
    .map((v) => v.trim())
    .join("\n");
}

async function promptContributors(): Promise<string | undefined> {
  const showContributors = await promptWithCancel(
    p.confirm({ message: "Display contributors list?" }),
  );
  if (!showContributors) return undefined;

  const written = await promptWithCancel(
    p.text({
      message: "List contributors in the format Name--username, one per line:",
      placeholder: "Beatriz Salles--3salles\nJohn Doe--johndoe",
      validate: (v) =>
        !v || v.trim() === "" ? "Enter at least one contributor." : undefined,
    }),
  );

  return buildContributorsTable(written);
}

async function promptLicense(info: ProjectInfo): Promise<string | undefined> {
  if (info.license) {
    const useDetected = await promptWithCancel(
      p.confirm({ message: `Detected license: "${info.license}". Use it?` }),
    );
    if (useDetected) return info.license;
  }

  const showLicense = await promptWithCancel(
    p.confirm({ message: "Display license section?" }),
  );
  if (!showLicense) return undefined;

  return promptWithCancel(
    p.text({
      message: "What is the project license?",
      placeholder: "MIT",
      validate: (v) =>
        !v || v.trim() === "" ? "License cannot be empty." : undefined,
    }),
  );
}

async function promptUsage(info: ProjectInfo): Promise<string | undefined> {
  const showUsage = await promptWithCancel(
    p.confirm({ message: "Display usage section?" }),
  );
  if (!showUsage) return undefined;

  const detectedScripts = Object.keys(info.scripts ?? {})
    .filter((s) => ["start", "dev", "serve", "preview"].includes(s))
    .map((s) => `npm run ${s}`);

  if (detectedScripts.length > 0) {
    p.log.success(`Detected scripts: ${detectedScripts.join(", ")}`);

    const firstScript = detectedScripts[0];
    if (firstScript) {
      const useDetected = await promptWithCancel(
        p.confirm({ message: `Use "${firstScript}" as usage command?` }),
      );
      if (useDetected) return firstScript;
    }
  }

  return promptWithCancel(
    p.text({
      message: "What is the command to use the project?",
      placeholder: "npx readme-gen or npm start",
      validate: (v) =>
        !v || v.trim() === "" ? "Command cannot be empty." : undefined,
    }),
  );
}

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
