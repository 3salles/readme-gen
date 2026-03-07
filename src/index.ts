import * as p from "@clack/prompts";
import fs from "fs";
import path from "path";
import { detectProject } from "./detector.js";
import type { TemplateData } from "./template.js";
import {
  buildContributorsTable,
  detectMissingFields,
  fillTemplate,
  loadTemplate,
} from "./template.js";

async function main() {
  p.intro("📝 README Generator");

  const projectPath = process.argv[2] ?? process.cwd();
  p.log.info(`Lendo projeto em: ${projectPath}`);

  const info = detectProject(projectPath);

  // Tech list
  const allDeps = {
    ...info.dependencies,
    ...info.devDependencies,
  };
  const techList = Object.keys(allDeps)
    .map((dep) => `* [${dep}](https://npmjs.com/package/${dep})`)
    .join("\n");

  // Descrição
  let description = info.description;

  if (description) {
    const useDetected = await p.confirm({
      message: `Descrição detectada: "${description}". Deseja usá-la?`,
    });

    if (p.isCancel(useDetected)) {
      p.cancel("Operação cancelada.");
      process.exit(0);
    }

    if (!useDetected) description = undefined;
  }

  if (!description) {
    const written = await p.text({
      message: "Escreva a descrição do projeto:",
      placeholder: "Um projeto incrível que faz...",
      validate: (v) =>
        !v || v.trim() === "" ? "A descrição não pode ser vazia." : undefined,
    });

    if (p.isCancel(written)) {
      p.cancel("Operação cancelada.");
      process.exit(0);
    }

    description = written;
  }

  // Autor
  const showAuthor = await p.confirm({
    message: "Deseja exibir o autor no README?",
  });

  if (p.isCancel(showAuthor)) {
    p.cancel("Operação cancelada.");
    process.exit(0);
  }

  let author: string | undefined;
  let githubUser: string | undefined;

  if (showAuthor) {
    author = info.author;
    githubUser = info.githubUser;

    if (author) {
      const useDetected = await p.confirm({
        message: `Autor detectado: "${author}". Deseja usá-lo?`,
      });

      if (p.isCancel(useDetected)) {
        p.cancel("Operação cancelada.");
        process.exit(0);
      }

      if (!useDetected) author = undefined;
    }

    if (!author) {
      const written = await p.text({
        message: "Qual o seu nome?",
        placeholder: "Beatriz Salles",
        validate: (v) =>
          !v || v.trim() === "" ? "O autor não pode ser vazio." : undefined,
      });

      if (p.isCancel(written)) {
        p.cancel("Operação cancelada.");
        process.exit(0);
      }

      author = written;
    }

    if (!githubUser) {
      const written = await p.text({
        message: "Qual o seu usuário do GitHub?",
        placeholder: "seu-usuario",
        validate: (v) =>
          !v || v.trim() === "" ? "O usuário não pode ser vazio." : undefined,
      });

      if (p.isCancel(written)) {
        p.cancel("Operação cancelada.");
        process.exit(0);
      }

      githubUser = written;
    }
  }

  // Docker
  let hasDocker: string | undefined;
  let dockerPort: string | undefined;

  const showDocker = await p.confirm({
    message: "Deseja exibir seção de Docker?",
  });

  if (p.isCancel(showDocker)) {
    p.cancel("Operação cancelada.");
    process.exit(0);
  }

  if (showDocker) {
    if (info.hasDocker) {
      p.log.success(
        `Dockerfile detectado! Porta: ${info.dockerPort ?? "não encontrada"}`,
      );
      hasDocker = "true";
      dockerPort = info.dockerPort;
    }

    if (!dockerPort) {
      const written = await p.text({
        message: "Qual a porta da aplicação?",
        placeholder: "3000",
        validate: (v) =>
          !v || v.trim() === "" ? "A porta não pode ser vazia." : undefined,
      });

      if (p.isCancel(written)) {
        p.cancel("Operação cancelada.");
        process.exit(0);
      }

      hasDocker = "true";
      dockerPort = written;
    }
  }

  // Env vars
  let envVars: string | undefined;

  const showEnvVars = await p.confirm({
    message: "Deseja exibir seção de variáveis de ambiente?",
  });

  if (p.isCancel(showEnvVars)) {
    p.cancel("Operação cancelada.");
    process.exit(0);
  }

  if (showEnvVars) {
    if (info.envVars && info.envVars.length > 0) {
      p.log.success(`Variáveis detectadas: ${info.envVars.join(", ")}`);
      envVars = info.envVars.join("\n");
    } else {
      const written = await p.text({
        message: "Liste as variáveis de ambiente (separadas por vírgula):",
        placeholder: "DATABASE_URL, API_KEY, PORT",
        validate: (v) =>
          !v || v.trim() === "" ? "Insira ao menos uma variável." : undefined,
      });

      if (p.isCancel(written)) {
        p.cancel("Operação cancelada.");
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
    message: "Deseja exibir lista de contribuintes?",
  });

  if (p.isCancel(showContributors)) {
    p.cancel("Operação cancelada.");
    process.exit(0);
  }

  if (showContributors) {
    const written = await p.text({
      message: "Liste os contribuintes no formato Nome--usuario, um por linha:",
      placeholder: "Beatriz Salles--3salles\nJohn Doe--johndoe",
      validate: (v) =>
        !v || v.trim() === "" ? "Insira ao menos um contribuinte." : undefined,
    });

    if (p.isCancel(written)) {
      p.cancel("Operação cancelada.");
      process.exit(0);
    }

    contributorsTable = buildContributorsTable(written);
  }

  // Licença
  let license: string | undefined;

  if (info.license) {
    const useDetected = await p.confirm({
      message: `Licença detectada: "${info.license}". Deseja usá-la?`,
    });

    if (p.isCancel(useDetected)) {
      p.cancel("Operação cancelada.");
      process.exit(0);
    }

    if (useDetected) license = info.license;
  }

  if (!license) {
    const showLicense = await p.confirm({
      message: "Deseja exibir seção de licença?",
    });

    if (p.isCancel(showLicense)) {
      p.cancel("Operação cancelada.");
      process.exit(0);
    }

    if (showLicense) {
      const written = await p.text({
        message: "Qual a licença do projeto?",
        placeholder: "MIT",
        validate: (v) =>
          !v || v.trim() === "" ? "A licença não pode ser vazia." : undefined,
      });

      if (p.isCancel(written)) {
        p.cancel("Operação cancelada.");
        process.exit(0);
      }

      license = written;
    }
  }

  // Monta o data
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
  };

  // Carrega o template
  const templatePath = process.argv[3];
  const template = loadTemplate(templatePath);

  // Detecta campos faltando
  const missing = detectMissingFields(template, data);

  if (missing.length > 0) {
    p.log.warn("Alguns campos não foram detectados automaticamente:");

    for (const field of missing) {
      const value = await p.text({
        message: `Qual o valor de "${field}"?`,
        placeholder: field,
      });

      if (p.isCancel(value)) {
        p.cancel("Operação cancelada.");
        process.exit(0);
      }

      data[field] = value;
    }
  }

  // Gera o README
  const readme = fillTemplate(template, data);
  const outputPath = path.join(projectPath, "README.md");
  fs.writeFileSync(outputPath, readme);

  p.outro(`✅ README.md gerado em ${outputPath}`);
}

main();
