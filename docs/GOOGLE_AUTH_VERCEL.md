# Google OAuth, Auth.js e Vercel

Este projeto usa Auth.js com Google OAuth para login web e tambem valida ID tokens do Google para a futura API mobile.

Dominio canonico de producao:

```text
https://lucrodoleite.com.br
```

Callback Google usado pelo Auth.js:

```text
https://lucrodoleite.com.br/api/auth/callback/google
```

## Quando alterar este arquivo

Atualize este guia sempre que trocar o dominio principal do app, trocar o projeto da Vercel ou recriar as credenciais OAuth no Google Cloud.

## 1. Configurar o Google Cloud

1. Acesse o Google Cloud Console.
2. Abra **APIs e servicos > Tela de consentimento OAuth**.
3. Em **Dominios autorizados**, adicione:

```text
lucrodoleite.com.br
```

4. Abra **APIs e servicos > Credenciais**.
5. Abra o OAuth Client ID usado pelo site ou crie um novo com tipo **Web application**.
6. Configure exatamente:

```text
Authorized JavaScript origins:
https://lucrodoleite.com.br

Authorized redirect URIs:
https://lucrodoleite.com.br/api/auth/callback/google
```

Nao adicione barra final no dominio. O redirect URI precisa bater exatamente com o callback acima; se estiver diferente, o Google retorna `redirect_uri_mismatch`.

Para desenvolvimento local, se quiser testar login Google fora da producao, adicione tambem:

```text
Authorized JavaScript origins:
http://localhost:3000

Authorized redirect URIs:
http://localhost:3000/api/auth/callback/google
```

## 2. Configurar variaveis na Vercel

Na raiz do projeto, com Vercel CLI autenticada:

```powershell
.\scripts\vercel-set-auth-domain.ps1
```

Esse script atualiza apenas:

```text
AUTH_URL=https://lucrodoleite.com.br
```

Para criar ou trocar as credenciais do Google no ambiente de producao:

```powershell
vercel env add AUTH_GOOGLE_ID production --value "SEU_CLIENT_ID_WEB" --force --yes --scope marcos-projects-462af1c5
vercel env add AUTH_GOOGLE_SECRET production --value "SEU_CLIENT_SECRET_WEB" --force --yes --scope marcos-projects-462af1c5
```

Para a futura API Android, crie um OAuth Client ID do tipo **Android** no Google Cloud e salve o client ID:

```powershell
vercel env add GOOGLE_ANDROID_CLIENT_ID production --value "SEU_CLIENT_ID_ANDROID" --force --yes --scope marcos-projects-462af1c5
```

Nunca coloque `AUTH_GOOGLE_SECRET`, `AUTH_SECRET` ou tokens reais em arquivos versionados.

## 3. Recuperar dados antigos depois de trocar dominio

Quando o usuario entra com o mesmo e-mail em um dominio novo, o app tenta sincronizar automaticamente fazendas vinculadas a contas Auth.js antigas com o mesmo e-mail.

Na tela **Configuracoes**, o botao **Recuperar dados antigos** executa tambem uma recuperacao manual:

- vincula fazendas antigas sem usuario;
- vincula todas as fazendas existentes quando o banco tem apenas um grupo de e-mail de usuario;
- bloqueia a recuperacao completa quando existem varios e-mails diferentes no banco, para evitar que uma conta errada acesse dados de outra pessoa.

Se o banco ja tiver mais de um e-mail e for necessario liberar a recuperacao completa para o produtor correto, adicione o e-mail dele na Vercel:

```powershell
vercel env add LEGACY_RECOVERY_EMAILS production --value "email-do-produtor@example.com" --force --yes --scope marcos-projects-462af1c5
```

Para mais de um e-mail autorizado, use virgulas:

```powershell
vercel env add LEGACY_RECOVERY_EMAILS production --value "produtor1@example.com,produtor2@example.com" --force --yes --scope marcos-projects-462af1c5
```

Depois faca novo deploy. O usuario autorizado deve entrar, abrir **Configuracoes**, clicar em **Recuperar dados antigos** e conferir o seletor de fazenda e o mes no topo, porque parte dos registros pode estar em outra fazenda ou periodo.

## 4. Fazer novo deploy

Alteracoes em variaveis da Vercel entram no runtime apenas depois de um novo deploy.

Fluxo recomendado:

```powershell
git add docs\GOOGLE_AUTH_VERCEL.md scripts\vercel-set-auth-domain.ps1 .env.example
git commit -m "docs: update google auth domain"
git push origin main
```

A Vercel deve criar um novo deployment de producao automaticamente.

## 5. Validar em producao

Depois que o deploy ficar `Ready`, valide:

```powershell
curl.exe -i https://lucrodoleite.com.br/api/health
curl.exe -i https://lucrodoleite.com.br/entrar
curl.exe -i https://lucrodoleite.com.br/painel
curl.exe -i https://lucrodoleite.com.br/api/v1/me
```

Resultados esperados sem sessao/token:

- `/api/health`: HTTP `200` e `status: "database_ready"`.
- `/entrar`: HTTP `200`.
- `/painel`: redirect para `/entrar?callbackUrl=%2Fpainel`.
- `/api/v1/me`: HTTP `401` com erro `missing_token`.

Teste manual obrigatorio:

1. Abra `https://lucrodoleite.com.br/entrar`.
2. Clique em **Entrar com Google**.
3. Confirme que a tela do Google aparece sem erro `redirect_uri_mismatch`.
4. Conclua o login.
5. Confirme que o app volta para o painel.

## 6. Checklist para nova troca de dominio

Substitua `https://lucrodoleite.com.br` pelo novo dominio em todos os pontos:

- Google Cloud OAuth consent screen: dominio autorizado sem `https://`.
- Google Cloud OAuth Client Web: Authorized JavaScript origins.
- Google Cloud OAuth Client Web: Authorized redirect URIs.
- Vercel production env: `AUTH_URL`.
- Documentacao: este arquivo.
- Scripts de validacao que chamam `/api/health`.

Depois faca novo deploy e repita a validacao.

## Referencias oficiais

- Auth.js Google Provider: https://authjs.dev/reference/core/providers/google
- Auth.js variaveis de ambiente: https://authjs.dev/guides/environment-variables
- Auth.js deployment: https://authjs.dev/getting-started/deployment
- Google OAuth Web Server: https://developers.google.com/identity/protocols/oauth2/web-server
- Google Client ID para Web: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
