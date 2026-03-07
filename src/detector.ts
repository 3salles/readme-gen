import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export interface ProjectInfo {
  name?: string;
  description?: string;
  author?: string;
  githubUser?: string;
  license?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  envVars?: string[];
  dockerPort?: string;
  hasDocker?: boolean;
}

export function detectProject(projectPath: string): ProjectInfo {
  const info: ProjectInfo = {};

  const pkgPath = path.join(projectPath, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    info.name = pkg.name;
    info.description = pkg.description;
    info.license = pkg.license;
    info.scripts = pkg.scripts;
    info.dependencies = pkg.dependencies;
    info.devDependencies = pkg.devDependencies;

    if (typeof pkg.author === "string") info.author = pkg.author;
    else if (pkg.author?.name) info.author = pkg.author.name;
  }

  // Busca licença no arquivo LICENSE se não encontrou no package.json
  if (!info.license) {
    const licenseFiles = ["LICENSE", "LICENSE.md", "LICENSE.txt"];
    for (const file of licenseFiles) {
      const licensePath = path.join(projectPath, file);
      if (fs.existsSync(licensePath)) {
        const content = fs.readFileSync(licensePath, "utf-8");
        if (content.includes("MIT")) info.license = "MIT";
        else if (content.includes("Apache")) info.license = "Apache 2.0";
        else if (content.includes("GPL")) info.license = "GPL";
        else if (content.includes("BSD")) info.license = "BSD";
        else info.license = file;
        break;
      }
    }
  }

  try {
    const gitUser = execSync("git config user.name", {
      cwd: projectPath,
      stdio: "pipe",
    })
      .toString()
      .trim();

    if (gitUser && !info.author) info.author = gitUser;
  } catch (error) {
    console.warn("Não foi possível ler o user.name do git:", error);
  }

  try {
    const remoteUrl = execSync("git config remote.origin.url", {
      cwd: projectPath,
      stdio: "pipe",
    })
      .toString()
      .trim();

    const match = remoteUrl.match(/github\.com[:/]([^/]+)\//);
    if (match?.[1]) info.githubUser = match[1];
  } catch (error) {
    console.warn("Não foi possível ler o remote.origin.url do git:", error);
  }

  const envPath = path.join(projectPath, ".env.example");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    info.envVars = lines
      .filter((l) => l.trim() && !l.startsWith("#"))
      .map((l) => l.split("=")[0]?.trim() ?? l.trim());
  }

  const dockerfilePath = path.join(projectPath, "Dockerfile");
  if (fs.existsSync(dockerfilePath)) {
    info.hasDocker = true;
    const content = fs.readFileSync(dockerfilePath, "utf-8");
    const portMatch = content.match(/EXPOSE\s+(\d+)/);
    if (portMatch) info.dockerPort = portMatch[1];
  }

  return info;
}
