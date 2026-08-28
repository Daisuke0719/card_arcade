# 参加者をリポジトリに招待し、未承諾の人を洗い出す（講師用）。
#
#   powershell -ExecutionPolicy Bypass -File scripts/setup-collaborators.ps1 -Users "alice","bob"
#   powershell -ExecutionPolicy Bypass -File scripts/setup-collaborators.ps1        # 状況の確認だけ
#
# 研修当日に 403 が出る原因の第1位は「招待メールを承諾していない」です。
# 前日までに、この確認で未承諾が 0 になっている状態にしてください。

param(
    [string[]]$Users = @()
)

$ErrorActionPreference = "Stop"

$config = Get-Content -Raw -Encoding UTF8 "harness/config.json" | ConvertFrom-Json
$repo = $config.repo

Write-Host ""
Write-Host "リポジトリ: $repo"
Write-Host ""

foreach ($user in $Users) {
    Write-Host ("  招待 " + $user)
    gh api -X PUT ("repos/" + $repo + "/collaborators/" + $user) -f permission=push | Out-Null
    if (-not $?) {
        Write-Host ("    失敗: " + $user) -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "現在の共同作業者:"
gh api ("repos/" + $repo + "/collaborators") --jq ".[] | ""  - "" + .login + "" ("" + .permissions.push + "")"""

Write-Host ""
Write-Host "未承諾の招待:"
$pending = gh api ("repos/" + $repo + "/invitations") --jq ".[] | ""  - "" + .invitee.login"

if ([string]::IsNullOrWhiteSpace($pending)) {
    Write-Host "  なし（全員が承諾済みです）"
}
else {
    Write-Host $pending
    Write-Host ""
    Write-Host "  上の人には、GitHub から届いた招待メールを承諾してもらってください。" -ForegroundColor Yellow
    Write-Host "  承諾していないと、当日 push した瞬間に 403 になります。" -ForegroundColor Yellow
}

Write-Host ""
