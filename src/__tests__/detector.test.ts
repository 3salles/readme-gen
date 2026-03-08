import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectProject } from "../detector.js";

// vi.mock is hoisted — intercepts child_process before detector.ts imports it
vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "readme-gen-test-"));
}

function writeJson(dir: string, filename: string, content: unknown) {
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(content));
}

function writeFile(dir: string, filename: string, content: string) {
  fs.writeFileSync(path.join(dir, filename), content);
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let tmpDir: string;

beforeEach(() => {
  tmpDir = makeTmpDir();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  // Default: git commands are unavailable
  vi.mocked(execSync).mockImplementation(() => {
    throw new Error("no git");
  });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// package.json parsing
// ---------------------------------------------------------------------------

describe("detectProject — package.json", () => {
  it("reads name, description, license from package.json", () => {
    writeJson(tmpDir, "package.json", {
      name: "my-app",
      description: "A test app",
      license: "MIT",
    });

    const info = detectProject(tmpDir);
    expect(info.name).toBe("my-app");
    expect(info.description).toBe("A test app");
    expect(info.license).toBe("MIT");
  });

  it("reads author as string from package.json", () => {
    writeJson(tmpDir, "package.json", { author: "Alice" });
    const info = detectProject(tmpDir);
    expect(info.author).toBe("Alice");
  });

  it("reads author.name when author is an object", () => {
    writeJson(tmpDir, "package.json", { author: { name: "Bob", email: "bob@example.com" } });
    const info = detectProject(tmpDir);
    expect(info.author).toBe("Bob");
  });

  it("reads scripts, dependencies, devDependencies", () => {
    writeJson(tmpDir, "package.json", {
      scripts: { start: "node index.js" },
      dependencies: { express: "^4.0.0" },
      devDependencies: { typescript: "^5.0.0" },
    });

    const info = detectProject(tmpDir);
    expect(info.scripts?.["start"]).toBe("node index.js");
    expect(info.dependencies?.["express"]).toBe("^4.0.0");
    expect(info.devDependencies?.["typescript"]).toBe("^5.0.0");
  });

  it("returns empty ProjectInfo when directory has no package.json", () => {
    const info = detectProject(tmpDir);
    expect(info.name).toBeUndefined();
    expect(info.description).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// LICENSE file detection
// ---------------------------------------------------------------------------

describe("detectProject — LICENSE file", () => {
  it("detects MIT from LICENSE file content when package.json has no license", () => {
    writeJson(tmpDir, "package.json", { name: "app" });
    writeFile(tmpDir, "LICENSE", "MIT License\nCopyright...");
    const info = detectProject(tmpDir);
    expect(info.license).toBe("MIT");
  });

  it("detects Apache 2.0 from LICENSE file", () => {
    writeJson(tmpDir, "package.json", { name: "app" });
    writeFile(tmpDir, "LICENSE", "Apache License Version 2.0");
    const info = detectProject(tmpDir);
    expect(info.license).toBe("Apache 2.0");
  });

  it("detects GPL from LICENSE file", () => {
    writeJson(tmpDir, "package.json", { name: "app" });
    writeFile(tmpDir, "LICENSE", "GNU GPL v3");
    const info = detectProject(tmpDir);
    expect(info.license).toBe("GPL");
  });

  it("detects BSD from LICENSE file", () => {
    writeJson(tmpDir, "package.json", { name: "app" });
    writeFile(tmpDir, "LICENSE", "BSD 2-Clause License");
    const info = detectProject(tmpDir);
    expect(info.license).toBe("BSD");
  });

  it("prefers license from package.json over LICENSE file", () => {
    writeJson(tmpDir, "package.json", { license: "ISC" });
    writeFile(tmpDir, "LICENSE", "MIT License");
    const info = detectProject(tmpDir);
    expect(info.license).toBe("ISC");
  });
});

// ---------------------------------------------------------------------------
// .env.example / .env parsing
// ---------------------------------------------------------------------------

describe("detectProject — .env.example", () => {
  it("extracts variable names from .env.example", () => {
    writeFile(tmpDir, ".env.example", "DATABASE_URL=\nAPI_KEY=secret\n");
    const info = detectProject(tmpDir);
    expect(info.envVars).toContain("DATABASE_URL");
    expect(info.envVars).toContain("API_KEY");
  });

  it("ignores comment lines in .env.example", () => {
    writeFile(tmpDir, ".env.example", "# This is a comment\nPORT=3000\n");
    const info = detectProject(tmpDir);
    expect(info.envVars).not.toContain("# This is a comment");
    expect(info.envVars).toContain("PORT");
  });

  it("ignores empty lines in .env.example", () => {
    writeFile(tmpDir, ".env.example", "\nAPI_KEY=\n\n");
    const info = detectProject(tmpDir);
    expect(info.envVars).toEqual(["API_KEY"]);
  });

  it("falls back to .env when .env.example does not exist", () => {
    writeFile(tmpDir, ".env", "DATABASE_URL=postgres://localhost\nSECRET=abc123\n");
    const info = detectProject(tmpDir);
    expect(info.envVars).toContain("DATABASE_URL");
    expect(info.envVars).toContain("SECRET");
  });

  it("prefers .env.example over .env when both exist", () => {
    writeFile(tmpDir, ".env.example", "EXAMPLE_VAR=\n");
    writeFile(tmpDir, ".env", "REAL_VAR=value\n");
    const info = detectProject(tmpDir);
    expect(info.envVars).toContain("EXAMPLE_VAR");
    expect(info.envVars).not.toContain("REAL_VAR");
  });
});

// ---------------------------------------------------------------------------
// Docker detection
// ---------------------------------------------------------------------------

describe("detectProject — Docker", () => {
  it("sets hasDocker to true when Dockerfile exists", () => {
    writeFile(tmpDir, "Dockerfile", "FROM node:20\nEXPOSE 3000\n");
    const info = detectProject(tmpDir);
    expect(info.hasDocker).toBe(true);
  });

  it("extracts the exposed port from Dockerfile", () => {
    writeFile(tmpDir, "Dockerfile", "FROM node:20\nEXPOSE 8080\n");
    const info = detectProject(tmpDir);
    expect(info.dockerPort).toBe("8080");
  });

  it("sets hasDocker true with no port when EXPOSE is absent", () => {
    writeFile(tmpDir, "Dockerfile", "FROM node:20\nRUN npm install\n");
    const info = detectProject(tmpDir);
    expect(info.hasDocker).toBe(true);
    expect(info.dockerPort).toBeUndefined();
  });

  it("sets hasDocker to true when docker-compose.yml exists", () => {
    writeFile(tmpDir, "docker-compose.yml", "services:\n  app:\n    image: node:20\n");
    const info = detectProject(tmpDir);
    expect(info.hasDocker).toBe(true);
  });

  it("sets hasDocker to true when docker-compose.yaml exists", () => {
    writeFile(tmpDir, "docker-compose.yaml", "services:\n  app:\n    image: node:20\n");
    const info = detectProject(tmpDir);
    expect(info.hasDocker).toBe(true);
  });

  it("sets hasDocker to true when package.json has a docker script", () => {
    writeJson(tmpDir, "package.json", { scripts: { "docker:build": "docker build ." } });
    const info = detectProject(tmpDir);
    expect(info.hasDocker).toBe(true);
  });

  it("does not set hasDocker when no Docker files or scripts exist", () => {
    const info = detectProject(tmpDir);
    expect(info.hasDocker).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Git integration
// ---------------------------------------------------------------------------

describe("detectProject — git", () => {
  it("uses git user.name as author fallback when package.json has no author", () => {
    writeJson(tmpDir, "package.json", { name: "app" });
    vi.mocked(execSync).mockImplementation((cmd) => {
      if (String(cmd).includes("user.name")) return Buffer.from("Git User\n");
      throw new Error("no remote");
    });

    const info = detectProject(tmpDir);
    expect(info.author).toBe("Git User");
  });

  it("does not override package.json author with git user.name", () => {
    writeJson(tmpDir, "package.json", { author: "Package Author" });
    vi.mocked(execSync).mockImplementation((cmd) => {
      if (String(cmd).includes("user.name")) return Buffer.from("Git User\n");
      throw new Error("no remote");
    });

    const info = detectProject(tmpDir);
    expect(info.author).toBe("Package Author");
  });

  it("extracts GitHub username from HTTPS remote URL", () => {
    vi.mocked(execSync).mockImplementation((cmd) => {
      if (String(cmd).includes("user.name")) return Buffer.from("Alice\n");
      if (String(cmd).includes("remote.origin.url"))
        return Buffer.from("https://github.com/alice/my-repo.git\n");
      throw new Error("unknown");
    });

    const info = detectProject(tmpDir);
    expect(info.githubUser).toBe("alice");
  });

  it("extracts GitHub username from SSH remote URL", () => {
    vi.mocked(execSync).mockImplementation((cmd) => {
      if (String(cmd).includes("user.name")) throw new Error("no user");
      if (String(cmd).includes("remote.origin.url"))
        return Buffer.from("git@github.com:alice/my-repo.git\n");
      throw new Error("unknown");
    });

    const info = detectProject(tmpDir);
    expect(info.githubUser).toBe("alice");
  });

  it("returns undefined githubUser when git remote is unavailable", () => {
    const info = detectProject(tmpDir);
    expect(info.githubUser).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Test script detection
// ---------------------------------------------------------------------------

describe("detectProject — test command", () => {
  it("detects 'test' script from package.json", () => {
    writeJson(tmpDir, "package.json", { scripts: { test: "vitest run" } });
    const info = detectProject(tmpDir);
    expect(info.testCommand).toBe("npm run test");
  });

  it("detects 'test:unit' script from package.json", () => {
    writeJson(tmpDir, "package.json", { scripts: { "test:unit": "vitest run" } });
    const info = detectProject(tmpDir);
    expect(info.testCommand).toBe("npm run test:unit");
  });

  it("returns undefined testCommand when no test script exists", () => {
    writeJson(tmpDir, "package.json", { scripts: { start: "node index.js" } });
    const info = detectProject(tmpDir);
    expect(info.testCommand).toBeUndefined();
  });
});
