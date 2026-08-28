# マイルストーンを作る（講師用）。
#
#   powershell -ExecutionPolicy Bypass -File scripts/setup-milestone.ps1
#
# GitHub Projects は使いません（トークンの scope に project が要るため）。
# 進み具合は npm run status で見ます。

$ErrorActionPreference = "Stop"

$config = Get-Content -Raw -Encoding UTF8 "harness/config.json" | ConvertFrom-Json
$repo = $config.repo
$title = "CARD ARCADE v1"

Write-Host ""
Write-Host "マイルストーンを作成します: $title ($repo)"

$existing = gh api ("repos/" + $repo + "/milestones") --jq ".[] | select(.title==""$title"") | .number"

if ($existing) {
    Write-Host "  既にあります（#$existing）。何もしません。"
    Write-Host ""
    exit 0
}

gh api ("repos/" + $repo + "/milestones") -f title="$title" -f description="研修当日に6ゲームすべてを公開する" | Out-Null

if ($?) {
    Write-Host "  作成しました。"
}
else {
    Write-Host "  作成に失敗しました。" -ForegroundColor Red
}

Write-Host ""
