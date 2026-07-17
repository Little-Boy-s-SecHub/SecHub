param(
  [ValidateSet('smoke','load','stress')] [string]$Profile = 'smoke',
  [string]$BaseUrl = 'http://localhost:8888/api',
  [int]$Vus = 20,
  [string]$Username = 'student',
  [string]$Password = 'student123'
)
$k6 = (Get-Command k6 -ErrorAction SilentlyContinue).Source
if (-not $k6) { $k6 = 'C:\Program Files\k6\k6.exe' }
if (-not (Test-Path $k6)) { throw 'k6 is not installed. Run: winget install --id GrafanaLabs.k6 --exact' }
& $k6 run -e "BASE_URL=$BaseUrl" -e "VUS=$Vus" -e "K6_USERNAME=$Username" -e "K6_PASSWORD=$Password" "performance/k6/$Profile.js"
exit $LASTEXITCODE
