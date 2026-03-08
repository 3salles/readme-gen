<p align="center">
  <h3 align="center">readme-cli-gen</h3>
</p>

<p align="center">
  <a href="https://github.com/3salles/readme-cli-gen">
    <img src="https://img.shields.io/github/repo-size/3salles/readme-cli-gen?style=for-the-badge" alt="GitHub repo size">
  </a>
  <a href="https://github.com/3salles/readme-cli-gen">
    <img src="https://img.shields.io/github/languages/count/3salles/readme-cli-gen?style=for-the-badge" alt="GitHub language count">
  </a>
  <a href="https://github.com/3salles/readme-cli-gen">
    <img src="https://img.shields.io/github/forks/3salles/readme-cli-gen?style=for-the-badge" alt="GitHub forks">
  </a>
  <a href="https://github.com/3salles/readme-cli-gen/issues">
    <img src="https://img.shields.io/github/issues/3salles/readme-cli-gen?style=for-the-badge" alt="GitHub open issues">
  </a>
  <a href="https://github.com/3salles/readme-cli-gen/pulls">
    <img src="https://img.shields.io/github/issues-pr/3salles/readme-cli-gen?style=for-the-badge" alt="GitHub open pull requests">
  </a>
  <img src="https://img.shields.io/static/v1?label=License&message=MIT&color=0000ff&style=for-the-badge" alt="License">
</p>

## 🗂 Table of Contents

- [About the Project](#book-about-the-project)
  - [Usage](#coffee-usage)
  - [Technologies](#computer-technologies)
- [Installation](#bricks-installation)
  - [Prerequisites](#construction-prerequisites)
  - [Installing Dependencies](#construction-installing-dependencies)
  - [Running](#arrow_forward-running)
  - [Running Tests](#test_tube-running-tests)
- [Contributing](#handshake-contributing)
- [License](#page_facing_up-license)
- [Author](#technologist-author)

## :book: About The Project

`readme-cli-gen` is a CLI tool that generates README.md files by scanning your project's structure. It automatically detects technologies, configuration files, and scripts — then asks only for the information it couldn't find. Each section is optional and only suggested when the relevant files or scripts are present in your project.

### :coffee: Usage

The easiest way to use `readme-cli-gen` is via `npx`, with no installation needed:

```bash
$ npx readme-cli-gen
```

To generate a README for a specific project, pass the path as an argument:

```bash
$ npx readme-cli-gen /path/to/your/project
```

To use a custom template:

```bash
$ npx readme-cli-gen /path/to/your/project /path/to/template.md
```

The tool scans your project and suggests sections based on what it finds:

| What it detects                                       | Section suggested     |
| ----------------------------------------------------- | --------------------- |
| `package.json`                                        | Technologies          |
| `.env.example`                                        | Environment Variables |
| `Dockerfile` / `docker-compose.yml`                   | Docker                |
| Test scripts (`test`, `vitest`, `jest`) or test files | Running Tests         |
| `LICENSE` / `package.json` license field              | License               |
| `git config` / `remote.origin.url`                    | Author                |

### :computer: Technologies

- [@clack/prompts](https://npmjs.com/package/@clack/prompts)
- [@types/node](https://npmjs.com/package/@types/node)
- [tsx](https://npmjs.com/package/tsx)
- [typescript](https://npmjs.com/package/typescript)
- [vitest](https://npmjs.com/package/vitest)

## :bricks: Installation

### :construction: Prerequisites

Clone this project repository:

```bash
$ git clone https://github.com/3salles/readme-cli-gen.git
$ cd readme-cli-gen
```

### :construction: Installing Dependencies

```bash
$ pnpm install
```

### :arrow_forward: Running

```bash
$ pnpm dev
```

### :test_tube: Running Tests

```bash
$ pnpm test
```

## :handshake: Contributing

To contribute to readme-cli-gen, follow these steps:

1. Fork this repository.
2. Create a branch: `git checkout -b <branch_name>`.
3. Make your changes and commit: `git commit -m '<commit_message>'`
4. Push to the original branch: `git push origin readme-cli-gen/<local>`
5. Create a pull request.

See the GitHub docs on [how to create a pull request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request).

## :page_facing_up: License

This project uses [MIT](LICENSE) license.

## :technologist: Author

[Beatriz Salles](https://github.com/3salles)
