import * as p from "@clack/prompts";
import type { ProjectInfo } from "./detector.js";
import { buildContributorsTable } from "./template.js";

export async function promptWithCancel<T>(promise: Promise<T | symbol>): Promise<T> {
  const result = await promise;
  if (p.isCancel(result)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }
  return result as T;
}

export async function promptDescription(info: ProjectInfo): Promise<string> {
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

export async function promptAuthor(
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

export async function promptDocker(
  info: ProjectInfo,
): Promise<{ hasDocker: string | undefined; dockerPort: string | undefined }> {
  if (!info.hasDocker) return { hasDocker: undefined, dockerPort: undefined };

  p.log.success(`Docker detected! Port: ${info.dockerPort ?? "not found"}`);

  const showDocker = await promptWithCancel(
    p.confirm({ message: "Display Docker section?" }),
  );
  if (!showDocker) return { hasDocker: undefined, dockerPort: undefined };

  if (info.dockerPort) {
    return { hasDocker: "true", dockerPort: info.dockerPort };
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

export async function promptEnvVars(info: ProjectInfo): Promise<string | undefined> {
  if (!info.envVars || info.envVars.length === 0) return undefined;

  p.log.success(`Detected variables: ${info.envVars.join(", ")}`);

  const showEnvVars = await promptWithCancel(
    p.confirm({ message: "Display environment variables section?" }),
  );
  if (!showEnvVars) return undefined;

  return info.envVars.join("\n");
}

export async function promptContributors(): Promise<string | undefined> {
  const showContributors = await promptWithCancel(
    p.confirm({ message: "Display contributors list?" }),
  );
  if (!showContributors) return undefined;

  const written = await promptWithCancel(
    p.text({
      message: "List contributors in the format Name--username (for multiple, separate with commas):",
      placeholder: "John Doe--jdoe, Mary Jane--mjay",
      validate: (v) =>
        !v || v.trim() === "" ? "Enter at least one contributor." : undefined,
    }),
  );

  const normalized = written.split(",").map((v) => v.trim()).join("\n");
  return buildContributorsTable(normalized);
}

export async function promptLicense(info: ProjectInfo): Promise<string | undefined> {
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

export async function promptTests(info: ProjectInfo): Promise<string | undefined> {
  if (info.testCommand) {
    const showTests = await promptWithCancel(
      p.confirm({ message: `Detected test command: "${info.testCommand}". Display tests section?` }),
    );
    if (!showTests) return undefined;

    const useCommand = await promptWithCancel(
      p.confirm({ message: `Use "${info.testCommand}" as test command?` }),
    );
    if (useCommand) return info.testCommand;

    return promptWithCancel(
      p.text({
        message: "What is the command to run the tests?",
        placeholder: "npm test",
        validate: (v) =>
          !v || v.trim() === "" ? "Command cannot be empty." : undefined,
      }),
    );
  }

  const showTests = await promptWithCancel(
    p.confirm({ message: "Display tests section?" }),
  );
  if (!showTests) return undefined;

  return promptWithCancel(
    p.text({
      message: "What is the command to run the tests?",
      placeholder: "npm test",
      validate: (v) =>
        !v || v.trim() === "" ? "Command cannot be empty." : undefined,
    }),
  );
}

export async function promptLocalInstall(info: ProjectInfo): Promise<string | undefined> {
  const showLocal = await promptWithCancel(
    p.confirm({ message: "Display local installation section?" }),
  );
  if (!showLocal) return undefined;

  const priority = ["dev", "start", "serve", "preview"];
  const detectedScripts = priority
    .filter((s) => s in (info.scripts ?? {}))
    .map((s) => `npm run ${s}`);

  const firstScript = detectedScripts[0];
  if (firstScript) {
    const useDetected = await promptWithCancel(
      p.confirm({ message: `Use "${firstScript}" as run command?` }),
    );
    if (useDetected) return firstScript;
  }

  return promptWithCancel(
    p.text({
      message: "What is the command to run the project locally?",
      placeholder: "npm run dev",
      validate: (v) =>
        !v || v.trim() === "" ? "Command cannot be empty." : undefined,
    }),
  );
}

export async function promptUsage(info: ProjectInfo): Promise<string | undefined> {
  const showUsage = await promptWithCancel(
    p.confirm({ message: "Display usage section?" }),
  );
  if (!showUsage) return undefined;

  const priority = ["start", "dev", "serve", "preview"];
  const detectedScripts = priority
    .filter((s) => s in (info.scripts ?? {}))
    .map((s) => `npm run ${s}`);

  if (detectedScripts.length > 0) {
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
