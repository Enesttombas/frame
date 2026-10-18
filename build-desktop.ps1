$ErrorActionPreference = 'Stop'
$frameRoot = $PSScriptRoot
$manifestPath = Join-Path $frameRoot 'manifest.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
if (-not $manifest.key) {
 $frameRsa = [System.Security.Cryptography.RSA]::Create(2048)
 try { $framePublicKey = [Convert]::ToBase64String($frameRsa.ExportSubjectPublicKeyInfo()) } finally { $frameRsa.Dispose() }
 $manifest | Add-Member -NotePropertyName key -NotePropertyValue $framePublicKey
 $manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding utf8
}
$frameHash = [System.Security.Cryptography.SHA256]::HashData([Convert]::FromBase64String($manifest.key))
$frameHex = [Convert]::ToHexString($frameHash)[0..31] -join ''
$frameId = -join ($frameHex.ToLower().ToCharArray() | ForEach-Object { [char](97 + [Convert]::ToInt32([string]$_, 16)) })
Set-Content -LiteralPath (Join-Path $frameRoot 'extension-id.txt') -Value $frameId -Encoding ascii
& 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe' /nologo /target:winexe /optimize+ "/out:$frameRoot\Frame.exe" /reference:System.Windows.Forms.dll /reference:System.Drawing.dll "$frameRoot\FrameTray.cs"
if ($LASTEXITCODE -ne 0) { throw 'Frame.exe derlenemedi.' }
$frameCheck = Start-Process -FilePath (Join-Path $frameRoot 'Frame.exe') -ArgumentList '--selfcheck' -WindowStyle Hidden -Wait -PassThru
if ($frameCheck.ExitCode -ne 0) { throw "Tepsi uygulaması kontrolü başarısız: $($frameCheck.ExitCode)" }
Write-Output "Frame.exe derlendi; loopback ve aç/kapat kontrolleri 0. Eklenti: $frameId"
