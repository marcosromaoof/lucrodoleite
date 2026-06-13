# Acesso Vercel e Migração do Banco

Este projeto usa `DATABASE_URL` na Vercel e migrations do Drizzle.

## Fluxo automático na Vercel

O deploy de produção executa:

```text
npm run build:vercel
```

Esse script roda `drizzle-kit migrate` apenas quando `VERCEL_ENV=production` e `DATABASE_URL` existe. Em ambiente local e previews, ele pula migrations.

Depois do deploy, confira:

```text
https://lucrodoleite.vercel.app/api/health
```

O retorno esperado é `status: "database_ready"` com `missingTables: []`.

## Gerar token Vercel

1. Entre na Vercel com a conta dona do projeto.
2. Abra o menu da conta pessoal, não o menu do time.
3. Vá em **Settings > Account Tokens**.
4. Clique em **Create**.
5. Dê um nome claro, por exemplo `codex-lucro-do-leite-migrate`.
6. Escolha um escopo que permita acessar o projeto `lucrodoleite`.
7. Copie o token imediatamente. A Vercel mostra o valor apenas uma vez.

## Rodar migrations de produção

Use este caminho apenas se for necessário rodar migrations manualmente fora do deploy.

No PowerShell, na raiz do projeto:

```powershell
$env:VERCEL_TOKEN = "cole_o_token_aqui"
.\scripts\vercel-production-migrate.ps1
```

O script faz quatro coisas:

1. Vincula a pasta local ao projeto `lucrodoleite` na Vercel.
2. Baixa as variáveis do ambiente `production` para um arquivo temporário.
3. Carrega `DATABASE_URL` apenas no processo atual.
4. Executa `npm run db:migrate` e valida `https://lucrodoleite.vercel.app/api/health`.

Por padrão, o arquivo temporário `.env.vercel.production.local` é removido ao final. Ele também já está protegido pelo `.gitignore`.

Em integrações gerenciadas, a Vercel pode listar a variável, mas entregar valor vazio no `env pull`. Nesse caso, use o fluxo automático do deploy ou defina `DATABASE_URL` manualmente na sessão do PowerShell antes de rodar `npm run db:migrate`.

## Conferir manualmente

Depois das migrations, este endpoint deve retornar `status: "database_ready"`:

```text
https://lucrodoleite.vercel.app/api/health
```

Se retornar `database_schema_pending`, o banco conecta, mas ainda faltam tabelas das migrations.
