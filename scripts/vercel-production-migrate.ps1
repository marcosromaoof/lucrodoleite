param(
  [string]$ProjectName = "lucrodoleite",
  [string]$Scope = "marcos-projects-462af1c5",
  [string]$Environment = "production",
  [string]$HealthUrl = "https://lucrodoleite.vercel.app/api/health",
  [string]$EnvFile = ".env.vercel.production.local",
  [switch]$KeepEnvFile
)

$ErrorActionPreference = "Stop"

function Import-DotEnvFile {
  param([string]$Path)

  foreach ($rawLine in Get-Content -LiteralPath $Path) {
    $line = $rawLine.Trim()

    if (-not $line -or $line.StartsWith("#")) {
      continue
    }

    $equalsIndex = $line.IndexOf("=")

    if ($equalsIndex -lt 1) {
      continue
    }

    $key = $line.Substring(0, $equalsIndex).Trim()
    $value = $line.Substring($equalsIndex + 1).Trim()

    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    [Environment]::SetEnvironmentVariable($key, $value, "Process")
  }
}

if (-not (Test-Path -LiteralPath "package.json")) {
  throw "Execute este script na raiz do projeto."
}

if (-not $env:VERCEL_TOKEN) {
  Write-Host "VERCEL_TOKEN nao definido; usando login local da Vercel CLI."
  & npx vercel@latest whoami | Out-Host
}

if (-not (Test-Path -LiteralPath ".vercel\project.json") -and -not (Test-Path -LiteralPath ".vercel\repo.json")) {
  Write-Host "Vinculando projeto Vercel..."
  $linkArgs = @("vercel@latest", "link", "--yes", "--project", $ProjectName)

  if ($Scope) {
    $linkArgs += @("--scope", $Scope)
  }

  & npx @linkArgs
}

try {
  Write-Host "Baixando variaveis do ambiente $Environment..."
  & npx vercel@latest env pull $EnvFile --yes "--environment=$Environment"

  Import-DotEnvFile -Path $EnvFile

  if (-not $env:DATABASE_URL -and $env:POSTGRES_URL) {
    $env:DATABASE_URL = $env:POSTGRES_URL
  }

  if (-not $env:DATABASE_URL) {
    throw "DATABASE_URL nao veio preenchida no env pull. Se o banco for uma integracao gerenciada da Vercel, use o deploy de producao para rodar migrations automaticamente ou defina DATABASE_URL manualmente nesta sessao."
  }

  Write-Host "Rodando migrations Drizzle no banco de producao..."
  & npm run db:migrate

  Write-Host "Validando health check publicado..."
  try {
    $response = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing
    Write-Host "HTTP $($response.StatusCode)"
    Write-Host $response.Content
  } catch {
    $response = $_.Exception.Response

    if ($response) {
      $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
      Write-Host "HTTP $([int]$response.StatusCode)"
      Write-Host $reader.ReadToEnd()
    } else {
      throw
    }
  }
} finally {
  if (-not $KeepEnvFile -and (Test-Path -LiteralPath $EnvFile)) {
    Remove-Item -LiteralPath $EnvFile -Force
    Write-Host "Arquivo temporario de env removido."
  }
}
