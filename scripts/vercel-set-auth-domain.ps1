param(
  [string]$Domain = "https://lucrodoleite.com.br",
  [string]$ProjectName = "lucrodoleite",
  [string]$Scope = "marcos-projects-462af1c5",
  [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"

if (-not $Domain.StartsWith("https://")) {
  throw "Use um dominio HTTPS completo, por exemplo: https://lucrodoleite.com.br"
}

if ($Domain.EndsWith("/")) {
  $Domain = $Domain.TrimEnd("/")
}

if (-not (Test-Path -LiteralPath "package.json")) {
  throw "Execute este script na raiz do projeto."
}

Write-Host "Projeto: $ProjectName"
Write-Host "Ambiente: $Environment"
Write-Host "AUTH_URL: $Domain"

& vercel env add AUTH_URL $Environment --value $Domain --force --yes --scope $Scope

Write-Host ""
Write-Host "AUTH_URL atualizado na Vercel."
Write-Host "Faca um novo deploy de producao para o valor entrar no runtime."
