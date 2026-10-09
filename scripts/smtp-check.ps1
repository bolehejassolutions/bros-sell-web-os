[CmdletBinding()]
param([switch]$SelfTest)

# Password is read masked, held in this process only, and passed through the
# child environment. Never put it in a command argument, source or saved file.
$ErrorActionPreference = 'Stop'
$smtpSecurePassword = Read-Host 'Kata laluan mailbox brossell (input terlindung)' -AsSecureString
$smtpPointer = [IntPtr]::Zero
$smtpPriorPassword = $env:BROS_SMTP_PASSWORD
$smtpExitCode = 1
try {
  $smtpPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpSecurePassword)
  $env:BROS_SMTP_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($smtpPointer)
  $smtpScript = Join-Path $PSScriptRoot 'smtp-check.ts'
  if ($SelfTest) {
    & node --experimental-strip-types $smtpScript --self-test
  } else {
    & node --experimental-strip-types $smtpScript
  }
  $smtpExitCode = $LASTEXITCODE
} finally {
  $env:BROS_SMTP_PASSWORD = $smtpPriorPassword
  $smtpPriorPassword = $null
  if ($smtpPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($smtpPointer)
  }
  $smtpSecurePassword.Dispose()
}
exit $smtpExitCode
