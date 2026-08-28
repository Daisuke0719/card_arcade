# main ブランチの保護を適用する（講師用）。
#
#   powershell -ExecutionPolicy Bypass -File scripts/setup-branch-protection.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/setup-branch-protection.ps1 -Remove
#
# 【重要】実行する順番
#   1. 参加者を招待し、全員に承諾させる（scripts/setup-collaborators.ps1）
#   2. マージ方式を Squash のみにする（このスクリプトが行います）
#   3. **テスト用の Pull Request を1本流して、CI のチェック名 "verify" を確定させる**
#   4. このスクリプトで保護を適用する
#   5. GitHub Pages を有効化する（Settings > Pages > Source: GitHub Actions）
#
#   3 を飛ばすと、必須チェックの名前が GitHub 側に登録されておらず、
#   すべての Pull Request が永久に pending のままになります。

param(
    [switch]$Remove
)

$ErrorActionPreference = "Stop"

$config = Get-Content -Raw -Encoding UTF8 "harness/config.json" | ConvertFrom-Json
$repo = $config.repo

if ($Remove) {
    Write-Host ""
    Write-Host "main の保護を解除します（$repo）" -ForegroundColor Yellow
    gh api -X DELETE ("repos/" + $repo + "/branches/main/protection")
    Write-Host ""
    Write-Host "解除しました。研修が終わったら必ず戻してください:" -ForegroundColor Yellow
    Write-Host "  powershell -ExecutionPolicy Bypass -File scripts/setup-branch-protection.ps1"
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "マージ方式を Squash のみにします"
gh repo edit $repo --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false --delete-branch-on-merge
Write-Host ""

Write-Host "main の保護を適用します"
gh api -X PUT ("repos/" + $repo + "/branches/main/protection") --input .github/branch-protection.json | Out-Null

if (-not $?) {
    Write-Host "  失敗しました。gh auth status で repo 権限があるか確認してください。" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "適用後の必須チェック:"
gh api ("repos/" + $repo + "/branches/main/protection") --jq ".required_status_checks.contexts"

Write-Host ""
Write-Host "上に [""verify""] と出ていれば成功です。"
Write-Host "空だった場合は、テスト用の Pull Request を1本流してから、もう一度実行してください。"
Write-Host ""
Write-Host "研修中に詰まったときの逃げ道（優先度順）:"
Write-Host "  1. gh pr merge <番号> --squash --admin --delete-branch"
Write-Host "  2. gh pr review <番号> --approve --body ""講師承認"""
Write-Host "  3. このスクリプトに -Remove を付けて保護を外す（最終手段。研修後に必ず戻す）"
Write-Host ""
