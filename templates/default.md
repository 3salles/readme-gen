<p align="center">
  <h3 align="center">{{project_name}}</h3>
</p>

<p align="center">
  ![GitHub repo size](https://img.shields.io/github/repo-size/{{github_user}}/{{project_name}}?style=for-the-badge)
  ![GitHub language count](https://img.shields.io/github/languages/count/{{github_user}}/{{project_name}}?style=for-the-badge)
  ![GitHub forks](https://img.shields.io/github/forks/{{github_user}}/{{project_name}}?style=for-the-badge)
  ![GitHub open issues](https://img.shields.io/github/issues/{{github_user}}/{{project_name}}?style=for-the-badge)
  ![GitHub open pull requests](https://img.shields.io/github/issues-pr/{{github_user}}/{{project_name}}?style=for-the-badge)
</p>

## 🗂 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
  {{#if env_vars}}_ [Variáveis de Ambiente](#variáveis-de-ambiente){{/if}}
  {{#if has_docker}}_ [Rodando com Docker](#rodando-com-docker){{/if}}
  {{#if contributors_table}}_ [Contribuintes](#contribuintes){{/if}}
  {{#if license}}_ [Licença](#licença){{/if}}
  {{#if author}}\* [Autor](#autor){{/if}}

## :book: Sobre o Projeto

{{description}}

### :computer: Tecnologias

{{tech_list}}

## :bricks: Instalação

### :construction: Pré-requisitos

Clone o repositório do projeto:

```bash
$ git clone https://github.com/{{github_user}}/{{project_name}}.git
$ cd {{project_name}}
```

### :construction: Instalando Dependências

```bash
$ pnpm install
```

{{#if env_vars}}

### :wrench: Variáveis de Ambiente

Crie um arquivo `.env` com as seguintes chaves:

```
{{env_vars}}
```

{{/if}}

{{#if has_docker}}

### :whale: Rodando com Docker

```bash
$ docker build -t {{project_name}} .
$ docker run -d -p {{docker_port}}:{{docker_port}} {{project_name}}
```

{{/if}}

### :arrow_forward: Rodando o Projeto

```bash
$ pnpm run dev
```

## :handshake: Contribuindo

Para contribuir com {{project_name}}, siga estes passos:

1. Faça um fork deste repositório.
2. Crie uma branch: `git checkout -b <nome_da_branch>`.
3. Faça suas alterações e confirme: `git commit -m '<mensagem_do_commit>'`
4. Envie para a branch original: `git push origin {{project_name}}/<local>`
5. Crie a solicitação de pull.

Consulte a documentação do GitHub sobre [como criar uma solicitação de pull](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request).

{{#if contributors_table}}

## 🤝 Contribuintes

Agradecemos às seguintes pessoas que contribuíram para este projeto:

{{contributors_table}}
{{/if}}

{{#if license}}

## :page_facing_up: Licença

Este projeto está sob a licença [{{license}}](LICENSE).
{{/if}}

{{#if author}}

## :technologist: Autor

[{{author}}](https://github.com/{{github_user}})
{{/if}}
