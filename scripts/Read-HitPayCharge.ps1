param([switch]$Check)
$ErrorActionPreference = 'Stop'
$nodeCommand = Get-Command node -ErrorAction Stop
$analyzerPath = Join-Path $PSScriptRoot 'inspect-hitpay-charge.mjs'
if (-not (Test-Path -LiteralPath $analyzerPath)) { throw 'Charge analyzer is missing.' }
if ($Check) { Write-Output 'Read-only Charge API verifier ready. No network request or credential read.'; exit 0 }
if (-not [System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform([System.Runtime.InteropServices.OSPlatform]::Windows)) {
  throw 'Run on Windows to protect the response with current-user DPAPI.'
}

$keySecure = Read-Host 'Existing HitPay business API key (hidden; not saved)' -AsSecureString
$chargeSecure = Read-Host 'Order #1007 actual charge UUID from private HitPay Support thread (hidden)' -AsSecureString
$apiKey = $null
$chargeId = $null
try {
  $apiKey = [System.Net.NetworkCredential]::new('', $keySecure).Password
  $chargeId = [System.Net.NetworkCredential]::new('', $chargeSecure).Password.Trim()
  if ([string]::IsNullOrWhiteSpace($apiKey) -or $chargeId -notmatch '^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$') {
    throw 'Required private input is invalid.'
  }
  # Fixed official provider endpoint; no dashboard cookies, tokens or redirects.
  try {
    $response = Invoke-WebRequest -Uri ('https://api.hit-pay.com/v1/charges/' + $chargeId) -Method Get `
      -Headers @{ 'X-BUSINESS-API-KEY' = $apiKey; 'Accept' = 'application/json' } `
      -MaximumRedirection 0 -TimeoutSec 30
  } catch { throw 'Authenticated Charge API GET failed. No provider response, credential or identifier was printed.' }
  $apiKey = $null
  if ($response.StatusCode -ne 200 -or $response.Content.Length -gt 1000000) { throw 'Charge API response was not accepted.' }
  $rawBody = [string]$response.Content
  $null = $rawBody | ConvertFrom-Json
  $evidenceDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ('BROS-SELL-Charge-Evidence-' + [guid]::NewGuid().ToString('N'))
  $null = New-Item -ItemType Directory -Path $evidenceDirectory
  # Customer data stays outside the repository and is encrypted for this Windows account.
  $encryptedBody = ConvertTo-SecureString -String $rawBody -AsPlainText -Force | ConvertFrom-SecureString
  Set-Content -LiteralPath (Join-Path $evidenceDirectory 'response.dpapi') -Value $encryptedBody -Encoding utf8
  $inspectionInput = @{ rawBody = $rawBody; chargeId = $chargeId } | ConvertTo-Json -Compress
  $reportLines = $inspectionInput | & $nodeCommand.Source $analyzerPath
  if ($LASTEXITCODE -ne 0) { throw 'Private response was retained, but redacted inspection failed.' }
  $reportObject = ($reportLines -join [Environment]::NewLine) | ConvertFrom-Json
  $reportObject.evidenceSource = 'authenticated_hitpay_charge_api'
  $reportObject.transportEvidence = 'HTTPS_200_FIXED_PROVIDER_ENDPOINT_NO_REDIRECTS'
  $reportObject | Add-Member -NotePropertyName retrievedAtUtc -NotePropertyValue ([DateTime]::UtcNow.ToString('o'))
  $redactedReport = $reportObject | ConvertTo-Json -Depth 8
  Set-Content -LiteralPath (Join-Path $evidenceDirectory 'report.json') -Value $redactedReport -Encoding utf8
  Write-Output $redactedReport
  Write-Output ('Private evidence directory: ' + $evidenceDirectory)
  Write-Output 'The response is encrypted for this Windows account. This operation does not enable grants or email.'
} catch {
  Write-Error 'Verification stopped. No customer data or secrets were printed. Check private inputs and the official API access.'
  exit 1
} finally {
  $apiKey = $null; $chargeId = $null; $rawBody = $null; $response = $null; $inspectionInput = $null
  $keySecure.Dispose(); $chargeSecure.Dispose()
}

