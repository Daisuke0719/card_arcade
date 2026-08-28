# 6チーム分の Issue を作る（講師用）。
#
#   powershell -ExecutionPolicy Bypass -File scripts/setup-issues.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/setup-issues.ps1 -DryRun
#
# 本文は .github/issue-bodies/*.md を --body-file で渡します。
# gh issue create --body "長い日本語" はコンソールの文字コードで壊れることがあるため、
# 必ずファイル経由にしてください（ファイルは UTF-8 BOM なし / LF でコミットしています）。
#
# 作成後、Issue 番号を harness/config.json に書き戻します。
# その差分は運営がコミットしてください（参加者の画面に Issue 番号が出るようになります）。

param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$configPath = "harness/config.json"
$config = Get-Content -Raw -Encoding UTF8 $configPath | ConvertFrom-Json
$repo = $config.repo

Write-Host ""
Write-Host "Issue を作成します: $repo"
if ($DryRun) { Write-Host "（-DryRun のため実際には作成しません）" }
Write-Host ""

$created = @{}

foreach ($team in $config.teams) {
    $bodyFile = ".github/issue-bodies/" + $team.team + "-" + $team.gameId + ".md"

    if (-not (Test-Path $bodyFile)) {
        Write-Host ("  スキップ " + $team.label + " : " + $bodyFile + " がありません") -ForegroundColor Yellow
        continue
    }

    $title = $team.name + "（" + $team.gameId + "）を実装する"
    $labels = "game," + $team.team + ",difficulty:" + $team.difficulty

    if ($DryRun) {
        Write-Host ("  [dry-run] " + $title + "  labels=" + $labels + "  body=" + $bodyFile)
        continue
    }

    $url = gh issue create --repo $repo --title $title --body-file $bodyFile --label $labels --milestone "CARD ARCADE v1"

    if ($?) {
        $number = ($url -split "/")[-1]
        $created[$team.gameId] = [int]$number
        Write-Host ("  作成 #" + $number + "  " + $title)
    }
    else {
        Write-Host ("  失敗 " + $title) -ForegroundColor Red
    }
}

if ($DryRun) {
    Write-Host ""
    Write-Host "-DryRun のため config.json は変更していません。"
    Write-Host ""
    exit 0
}

# Issue 番号を単一の真実源へ書き戻す
if ($created.Count -gt 0) {
    foreach ($team in $config.teams) {
        if ($created.ContainsKey($team.gameId)) {
            $team.issue = $created[$team.gameId]
        }
    }

    $json = $config | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText((Resolve-Path $configPath), $json + "`n", (New-Object System.Text.UTF8Encoding($false)))

    Write-Host ""
    Write-Host "harness/config.json に Issue 番号を書き戻しました。"
    Write-Host "次を実行して、雛形とタイルに Issue 番号を反映してください:"
    Write-Host ""
    Write-Host "  npm run scaffold -- --all --force"
    Write-Host "  npm run verify"
    Write-Host "  git add -A; git commit -m ""chore: Issue 番号を反映"""
    Write-Host ""
}
