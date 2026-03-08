import * as p from "@clack/prompts";
import fs from "fs";
import path from "path";
import { detectProject } from "./detector.js";
import type { TemplateData } from "./template.js";
import {
  buildContributorsTable,
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

  // Tech list
  const allDeps = {
    ...info.dependencies,
    ...info.devDependencies,
  };
  const techList = Object.keys(allDeps)
    .map((dep) => `* [${dep}](https://npmjs.com/package/${dep})`)
    .join("\n");

  // Description
  let description = info.description;

  if (description) {
    const useDetected = await p.confirm({
      message: `Detected description: "${description}". Use it?`,
    });

    if (p.isCancel(useDetected)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    if (!useDetected) description = undefined;
  }

  if (!description) {
    const written = await p.text({
      message: "Write the project description:",
      placeholder: "An amazing project that does...",
      validate: (v) =>
        !v || v.trim() === "" ? "Description cannot be empty." : undefined,
    });

    if (p.isCancel(written)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    description = written;
  }

  // Author
  const showAuthor = await p.confirm({
    message: "Display author in the README?",
  });

  if (p.isCancel(showAuthor)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  let author: string | undefined;
  let githubUser: string | undefined;

  if (showAuthor) {
    author = info.author;
    githubUser = info.githubUser;

    if (author) {
      const useDetected = await p.confirm({
        message: `Detected author: "${author}". Use it?`,
      });

      if (p.isCancel(useDetected)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }

      if (!useDetected) {
        author = undefined;
        githubUser = undefined;
      }
    }

    if (!author) {
      const written = await p.text({
        message: "What is your name?",
        placeholder: "Beatriz Salles",
        validate: (v) =>
          !v || v.trim() === "" ? "Author cannot be empty." : undefined,
      });

      if (p.isCancel(written)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }

      author = written;
    }

    if (githubUser) {
      const useDetected = await p.confirm({
        message: `Detected GitHub user: "${githubUser}". Use it?`,
      });

      if (p.isCancel(useDetected)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }

      if (!useDetected) githubUser = undefined;
    }

    if (!githubUser) {
      const written = await p.text({
        message: "What is your GitHub username?",
        placeholder: "your-username",
        validate: (v) =>
          !v || v.trim() === "" ? "Username cannot be empty." : undefined,
      });

      if (p.isCancel(written)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }

      githubUser = written;
    }
  }

  // Docker
  let hasDocker: string | undefined;
  let dockerPort: string | undefined;

  const showDocker = await p.confirm({
    message: "Display Docker section?",
  });

  if (p.isCancel(showDocker)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  if (showDocker) {
    if (info.hasDocker) {
      p.log.success(
        `Dockerfile detected! Port: ${info.dockerPort ?? "not found"}`,
      );
      hasDocker = "true";
      dockerPort = info.dockerPort;
    }

    if (!dockerPort) {
      const written = await p.text({
        message: "What is the application port?",
        placeholder: "3000",
        validate: (v) =>
          !v || v.trim() === "" ? "Port cannot be empty." : undefined,
      });

      if (p.isCancel(written)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }

      hasDocker = "true";
      dockerPort = written;
    }
  }

  // Env vars
  let envVars: string | undefined;

  const showEnvVars = await p.confirm({
    message: "Display environment variables section?",
  });

  if (p.isCancel(showEnvVars)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  if (showEnvVars) {
    if (info.envVars && info.envVars.length > 0) {
      p.log.success(`Detected variables: ${info.envVars.join(", ")}`);
      envVars = info.envVars.join("\n");
    } else {
      const written = await p.text({
        message: "List environment variables (comma-separated):",
        placeholder: "DATABASE_URL, API_KEY, PORT",
        validate: (v) =>
          !v || v.trim() === "" ? "Enter at least one variable." : undefined,
      });

      if (p.isCancel(written)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }

      envVars = written
        .split(",")
        .map((v) => v.trim())
        .join("\n");
    }
  }

  // Contributors
  let contributorsTable: string | undefined;

  const showContributors = await p.confirm({
    message: "Display contributors list?",
  });

  if (p.isCancel(showContributors)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  if (showContributors) {
    const written = await p.text({
      message: "List contributors in the format Name--username, one per line:",
      placeholder: "Beatriz Salles--3salles\nJohn Doe--johndoe",
      validate: (v) =>
        !v || v.trim() === "" ? "Enter at least one contributor." : undefined,
    });

    if (p.isCancel(written)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    contributorsTable = buildContributorsTable(written);
  }

  // License
  let license: string | undefined;

  if (info.license) {
    const useDetected = await p.confirm({
      message: `Detected license: "${info.license}". Use it?`,
    });

    if (p.isCancel(useDetected)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    if (useDetected) license = info.license;
  }

  if (!license) {
    const showLicense = await p.confirm({
      message: "Display license section?",
    });

    if (p.isCancel(showLicense)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    if (showLicense) {
      const written = await p.text({
        message: "What is the project license?",
        placeholder: "MIT",
        validate: (v) =>
          !v || v.trim() === "" ? "License cannot be empty." : undefined,
      });

      if (p.isCancel(written)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }

      license = written;
    }
  }

  const licenseBadge = license
    ? `![License](https://img.shields.io/static/v1?label=License&message=${encodeURIComponent(license)}&color=0000ff&style=for-the-badge)`
    : undefined;

  let usageCommand: string | undefined;

  const showUsage = await p.confirm({
    message: "Display usage section?",
  });

  if (p.isCancel(showUsage)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  if (showUsage) {
    const detectedScripts = Object.keys(info.scripts ?? {})
      .filter((s) => ["start", "dev", "serve", "preview"].includes(s))
      .map((s) => `npm run ${s}`);

    if (detectedScripts.length > 0) {
      p.log.success(`Detected scripts: ${detectedScripts.join(", ")}`);

      const useDetected = await p.confirm({
        message: `Use "${detectedScripts[0]}" as usage command?`,
      });

      if (p.isCancel(useDetected)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }

      if (useDetected) usageCommand = detectedScripts[0];
    }

    if (!usageCommand) {
      const written = await p.text({
        message: "What is the command to use the project?",
        placeholder: "npx readme-gen or npm start",
        validate: (v) =>
          !v || v.trim() === "" ? "Command cannot be empty." : undefined,
      });

      if (p.isCancel(written)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }

      usageCommand = written;
    }
  }

  const tableOfContents = buildTableOfContents({
    env_vars: envVars,
    has_docker: hasDocker,
    contributors_table: contributorsTable,
    license,
    author,
    usage_command: usageCommand,
  });

  // Build data
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

  // Load template
  const templatePath = process.argv[3];
  const template = loadTemplate(templatePath);

  // Detect missing fields
  const missing = detectMissingFields(template, data);

  if (missing.length > 0) {
    p.log.warn("Some fields were not detected automatically:");

    for (const field of missing) {
      const value = await p.text({
        message: `What is the value of "${field}"?`,
        placeholder: field,
      });

      if (p.isCancel(value)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }

      data[field] = value;
    }
  }

  // Generate README
  const readme = fillTemplate(template, data);
  const outputPath = path.join(projectPath, "README.md");
  fs.writeFileSync(outputPath, readme);

  p.outro(`✅ README.md generated at ${outputPath}`);
}

main();
