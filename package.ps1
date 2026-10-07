$ErrorActionPreference = 'Stop'
& node (Join-Path $PSScriptRoot 'scripts/build.js')
if ($LASTEXITCODE -ne 0) { throw 'Extension build failed' }
$extensionVersion = (Get-Content -Raw (Join-Path $PSScriptRoot 'manifest.json') | ConvertFrom-Json).version
foreach ($browser in @('chrome', 'firefox')) {
  $buildPath = Join-Path $PSScriptRoot "bin/$browser"
  $archivePath = Join-Path $PSScriptRoot "bin/steam-context-menu-$browser-$extensionVersion.zip"
  Compress-Archive -Path (Join-Path $buildPath '*') -DestinationPath $archivePath -Force
  Write-Output $archivePath
}
