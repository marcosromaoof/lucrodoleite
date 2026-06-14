# Configuracao do Google OAuth na Vercel

O app usa Auth.js com Google OAuth. O banco e `AUTH_SECRET` ja podem estar configurados na Vercel, mas o login so funciona depois de criar as credenciais no Google Cloud.

## 1. Criar credencial Web no Google Cloud

1. Acesse Google Cloud Console.
2. Abra **APIs e servicos > Credenciais**.
3. Crie um **OAuth client ID** do tipo **Web application**.
4. Configure:
   - Authorized JavaScript origins: `https://lucrodoleite.vercel.app`
   - Authorized redirect URIs: `https://lucrodoleite.vercel.app/api/auth/callback/google`

## 2. Salvar na Vercel

Use a Vercel CLI no diretorio do projeto:

```powershell
vercel env add AUTH_GOOGLE_ID production --value "SEU_CLIENT_ID" --yes
vercel env add AUTH_GOOGLE_SECRET production --value "SEU_CLIENT_SECRET" --yes
```

Para o app Android futuro, crie tambem um OAuth client ID do tipo Android e salve:

```powershell
vercel env add GOOGLE_ANDROID_CLIENT_ID production --value "SEU_ANDROID_CLIENT_ID" --yes
```

## 3. Atualizar ambiente local

```powershell
vercel env pull .env.local
```

Depois rode:

```powershell
npm run build:vercel
```

