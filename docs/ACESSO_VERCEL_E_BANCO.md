# Acesso Vercel e Migracao do Banco

Este projeto usa `DATABASE_URL` na Vercel e migrations do Drizzle.

Dominio canonico de producao:

```text
https://lucrodoleite.com.br
```

## Fluxo automatico na Vercel

O deploy de producao executa:

```text
npm run build:vercel
```

Esse script roda `drizzle-kit migrate` apenas quando `VERCEL_ENV=production` e `DATABASE_URL` existe. Em ambiente local e previews, ele pula migrations.

Depois do deploy, confira:

```text
https://lucrodoleite.com.br/api/health
```

O retorno esperado e `status: "database_ready"` com `missingTables: []`.

## Gerar token Vercel

1. Entre na Vercel com a conta dona do projeto.
2. Abra o menu da conta pessoal, nao o menu do time.
3. Va em **Settings > Account Tokens**.
4. Clique em **Create**.
5. De um nome claro, por exemplo `codex-lucro-do-leite-migrate`.
6. Escolha um escopo que permita acessar o projeto `lucrodoleite`.
7. Copie o token imediatamente. A Vercel mostra o valor apenas uma vez.

## Rodar migrations de producao

Use este caminho apenas se for necessario rodar migrations manualmente fora do deploy.

No PowerShell, na raiz do projeto:

```powershell
$env:VERCEL_TOKEN = "cole_o_token_aqui"
.\scripts\vercel-production-migrate.ps1
```

O script faz quatro coisas:

1. Vincula a pasta local ao projeto `lucrodoleite` na Vercel.
2. Baixa as variaveis do ambiente `production` para um arquivo temporario.
3. Carrega `DATABASE_URL` apenas no processo atual.
4. Executa `npm run db:migrate` e valida `https://lucrodoleite.com.br/api/health`.

Por padrao, o arquivo temporario `.env.vercel.production.local` e removido ao final. Ele tambem esta protegido pelo `.gitignore`.

Em integracoes gerenciadas, a Vercel pode listar a variavel, mas entregar valor vazio no `env pull`. Nesse caso, use o fluxo automatico do deploy ou defina `DATABASE_URL` manualmente na sessao do PowerShell antes de rodar `npm run db:migrate`.

## Conferir manualmente

Depois das migrations, este endpoint deve retornar `status: "database_ready"`:

```text
https://lucrodoleite.com.br/api/health
```

Se retornar `database_schema_pending`, o banco conecta, mas ainda faltam tabelas das migrations.
