<p align="center">
  <h3 align="center">{{project_name}}</h3>
</p>

<p align="center">
  <a href="https://github.com/{{github_user}}/{{project_name}}">
    <img src="https://img.shields.io/github/repo-size/{{github_user}}/{{project_name}}?style=for-the-badge" alt="GitHub repo size">
  </a>
  <a href="https://github.com/{{github_user}}/{{project_name}}">
    <img src="https://img.shields.io/github/languages/count/{{github_user}}/{{project_name}}?style=for-the-badge" alt="GitHub language count">
  </a>
  <a href="https://github.com/{{github_user}}/{{project_name}}">
    <img src="https://img.shields.io/github/forks/{{github_user}}/{{project_name}}?style=for-the-badge" alt="GitHub forks">
  </a>
  <a href="https://github.com/{{github_user}}/{{project_name}}/issues">
    <img src="https://img.shields.io/github/issues/{{github_user}}/{{project_name}}?style=for-the-badge" alt="GitHub open issues">
  </a>
  <a href="https://github.com/{{github_user}}/{{project_name}}/pulls">
    <img src="https://img.shields.io/github/issues-pr/{{github_user}}/{{project_name}}?style=for-the-badge" alt="GitHub open pull requests">
  </a>
  {{#if license_badge}}<img src="https://img.shields.io/static/v1?label=License&message={{license}}&color=0000ff&style=for-the-badge" alt="License">{{/if}}
</p>

## 🗂 Table of Contents

- [About the Project](#book-about-the-project)
  - [Technologies](#computer-technologies)
- [Installation](#bricks-installation)
  - [Prerequisites](#construction-prerequisites)
  - [Installing Dependencies](#construction-installing-dependencies)
    {{#if env_vars}} _ [Environment Variables](#wrench-environment-variables){{/if}}
    {{#if has_docker}} _ [Running with Docker](#whale-running-with-docker){{/if}}
  - [Running](#arrow_forward-running)
- [Contributing](#handshake-contributing)
  {{#if contributors_table}}_ [Contributors](#contributors){{/if}}
  {{#if license}}_ [License](#page_facing_up-license){{/if}}
  {{#if author}}\* [Author](#technologist-author){{/if}}

## :book: About The Project

{{description}}

### :computer: Technologies

{{tech_list}}

## :bricks: Installation

### :construction: Prerequisites

Clone this project repository:

```bash
$ git clone https://github.com/{{github_user}}/{{project_name}}.git
$ cd {{project_name}}
```

### :construction: Installing Dependencies

```bash
$ npm install
```

{{#if env_vars}}

### :wrench: Environment Variables

Create a `.env` file with the following keys:

```
{{env_vars}}
```

{{/if}}

{{#if has_docker}}

### :whale: Running with Docker

```bash
$ docker build -t {{project_name}} .
$ docker run -d -p {{docker_port}}:{{docker_port}} {{project_name}}
```

{{/if}}

### :arrow_forward: Running

```bash
$ npm run dev
```

## :handshake: Contributing

To contribute to {{project_name}}, follow these steps:

1. Fork this repository.
2. Create a branch: `git checkout -b <branch_name>`.
3. Make your changes and commit: `git commit -m '<commit_message>'`
4. Push to the original branch: `git push origin {{project_name}}/<local>`
5. Create a pull request.

See the GitHub docs on [how to create a pull request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request).

{{#if contributors_table}}

## 🤝 Contributors

Thanks to the following people who contributed to this project:

{{contributors_table}}
{{/if}}

{{#if license}}

## :page_facing_up: License

This project uses [{{license}}](LICENSE) license.
{{/if}}

{{#if author}}

## :technologist: Author

[{{author}}](https://github.com/{{github_user}})
{{/if}}
