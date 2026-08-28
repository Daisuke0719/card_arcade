# CARD ARCADE のラベルを作る（講師用）。
#
#   powershell -ExecutionPolicy Bypass -File scripts/setup-labels.ps1
#
# --force を付けているので、何度実行しても安全です。

$ErrorActionPreference = "Stop"

$config = Get-Content -Raw -Encoding UTF8 "harness/config.json" | ConvertFrom-Json
$repo = $config.repo

Write-Host ""
Write-Host "ラベルを作成します: $repo"
Write-Host ""

$labels = @(
    @{ name = "game";                 color = "1d76db"; description = "チームが担当するゲームの実装" },
    @{ name = "team-a";               color = "5319e7"; description = "Team A / ババ抜き" },
    @{ name = "team-b";               color = "5319e7"; description = "Team B / 神経衰弱" },
    @{ name = "team-c";               color = "5319e7"; description = "Team C / スピード" },
    @{ name = "team-d";               color = "5319e7"; description = "Team D / 七並べ" },
    @{ name = "team-e";               color = "5319e7"; description = "Team E / ダウト" },
    @{ name = "team-f";               color = "5319e7"; description = "Team F / 大富豪" },
    @{ name = "difficulty:easy";      color = "0e8a16"; description = "初級" },
    @{ name = "difficulty:normal";    color = "0075ca"; description = "中級" },
    @{ name = "difficulty:hard";      color = "d93f0b"; description = "上級" },
    @{ name = "stretch-goal";         color = "fbca04"; description = "発展課題（必須ではない）" },
    @{ name = "blocked";              color = "b60205"; description = "詰まっている・講師の判断待ち" },
    @{ name = "bug";                  color = "d73a4a"; description = "大会で見つかった不具合" },
    @{ name = "core-change";          color = "e99695"; description = "共通基盤の変更を含む（講師レビュー必須）" },
    @{ name = "harness:override";     color = "c5def5"; description = "講師のみ: 範囲チェックを警告に降格する" }
)

foreach ($label in $labels) {
    gh label create $label.name --repo $repo --color $label.color --description $label.description --force
    if ($?) {
        Write-Host ("  作成 " + $label.name)
    }
    else {
        Write-Host ("  失敗 " + $label.name) -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "完了しました。次は scripts/setup-milestone.ps1 → scripts/setup-issues.ps1 の順に実行してください。"
Write-Host ""
