import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {Presentation, PresentationFile, FileBlob} from '@oai/artifact-tool';
const root='C:/Users/daisu/project/card_arcade';
const dir=path.join(root,'.slide-build');
const skill='C:/Users/daisu/.codex/plugins/cache/openai-primary-runtime/presentations/26.904.11930/skills/presentations';
const runtime='C:/Users/daisu/.cache/codex-runtimes/codex-primary-runtime/dependencies';
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')));
const p=Presentation.create({slideSize:{width:1600,height:900}});
const C={navy:'#142C46',teal:'#007F83',ink:'#263A4D',muted:'#617184',light:'#EAF4F4',line:'#D8E2EA',white:'#FFFFFF'};
const font='Meiryo';
const fontPolicy={basis:'design',families:[font]};
function rect(s,x,y,w,h,fill){return s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill,line:{fill:'none',width:0}});}
function txt(s,text,x,y,w,h,size=34,color=C.ink,bold=false){const t=rect(s,x,y,w,h,'none');t.text=text;t.text.style={typeface:font,fontSize:size,color,bold,autoFit:'none',verticalAlignment:'top'};return t;}
function base(title,phase=0,sub='') {const s=p.slides.add();s.background.fill=C.white;rect(s,70,65,8,64,C.teal);txt(s,title,100,54,1430,90,48,C.navy,true);if(sub)txt(s,sub,100,151,1410, sixty(),30,C.muted);rect(s,80,838,1440,2,C.line);txt(s,phase?`手順書：フェーズ${phase}  |  docs/handson-steps.md`:'Claude Code × GitHub 共同開発ハンズオン',80,852,1340,30,18,C.muted);txt(s,String(p.slides.items.length).padStart(2,'0'),1460,849,65,36,22,C.navy,true);return s;}
function sixty(){return 60;}
function band(s,text,y=745){rect(s,80,y,1440,70,C.light);txt(s,text,104,y+10,1390,50,30,C.teal,true);}
function rows(s,items,{x=100,y=230,w=1380,step=112,size=34}={}){items.forEach((a,i)=>{txt(s,String(i+1).padStart(2,'0'),x,y+i*step,76,50,32,C.teal,true);txt(s,a,x+100,y+i*step,w-100,step-12,size);});}
function cols(s,items,y=260){const n=items.length,w=1400/n;items.forEach((a,i)=>{let x=100+i*w;rect(s,x,y,w-38,5,C.teal);txt(s,a[0],x,y+30,w-42,70,37,C.navy,true);txt(s,a[1],x,y+125,w-48,y>400?165:280,34);});}
function table(s,values,widths,{x=90,y=238,h=425,size=32}={}){let t=s.tables.add({rows:values.length,columns:values[0].length,left:x,top:y,width:widths.reduce((a,b)=>a+b,0),height:h,columnWidths:widths,values});t.borders.assign({fill:C.white,width:2});for(let r=0;r<values.length;r++)for(let c=0;c<values[0].length;c++){let cell=t.getCell(r,c);cell.fill=r===0?C.navy:r%2? '#F0F5F8': '#FFFFFF';cell.text.style={typeface:font,fontSize:size,color:r===0?C.white:C.ink,bold:r===0,autoFit:'none'};}return t;}
function code(s,text,x=110,y=300,w=1380,h=140,size=34){rect(s,x-15,y-12,w+30,h+24,'#F1F5F8');txt(s,text,x,y,w,h,size,C.navy);}
// 01
{let s=p.slides.add();s.background.fill=C.white;rect(s,95,135,100,10,C.teal);txt(s,'Claude Code × GitHub',95,190,1410,80,52,C.navy,true);txt(s,'共同開発ハンズオン',95,282,1410,100,72,C.navy,true);txt(s,'みんなでつくる CARD ARCADE',98,430,1400,75,43,C.teal,true);txt(s,'研修用スライド',100,688,1000,60,30,C.muted);rect(s,95,811,1410,2,C.line);txt(s,'操作・プロンプトの全文：docs/handson-steps.md',100,832,1400,42,24,C.muted);}
// 02
{let s=base('研修の到達目標',0,'1人1ゲームを担当し、調査から公開確認までの流れを経験します');cols(s,[['仕様を確認する','Issueの必須要件を読み、\n実装する範囲を決める'],['AIと実装を進める','計画を確認して実装する\n動作とテスト結果を確認'],['変更を提出する','Pull Requestを提出\n統合・公開の結果を確認']]);band(s,'到達の確認：担当ゲームを公開URLで開始できる');}
// 03
{let s=base('9人の成果を、1つのアーケードへ統合',0,'参加者9名がそれぞれ1ゲームを担当します。チームには分かれません');const games=JSON.parse(await fs.readFile(path.join(root,'harness/config.json'),'utf8')).participants;games.forEach((g,i)=>{let x=100+(i%3)*480,y=238+Math.floor(i/3)*138;rect(s,x,y,438,106,C.light);txt(s,`${g.displayName}  ${g.name}`,x+20,y+12,405,48,32,C.navy,true);txt(s,'準備中 → 公開後にプレイ可能',x+20,y+63,405,32,23,C.teal);});band(s,'最初は「ハイ＆ロー」を試遊し、完成したゲームの動きを確認します');}
// 04
{let s=base('Issue・ブランチ・Pull Requestの関係',0,'同じリポジトリで作業し、担当ごとの変更をmainへ集約します');cols(s,[['Issue','実装する要件を記録する\n担当ゲームの仕様を確認'],['ブランチ','変更を進める作業場所\nfeature/<ゲームID>'],['Pull Request','変更を提出する窓口\n差分・説明・検証結果を\n共有する']]);band(s,'Commit：変更の記録 → Push：GitHubへ送信 → 講師がmainへマージ');}
// 05
{let s=base('7フェーズで進める共同開発',0,'各フェーズの完了条件を確認してから、次へ進みます');const a=['1  環境を用意する','2  担当ルールを読む','3  雛形・Draft PR','4  ゲームを実装する','5  検証・不具合修正','6  PRを提出する','7  マージ・公開確認'];a.forEach((v,i)=>{let x=i<4?100+i*370:285+(i-4)*370,y=i<4?290:505;rect(s,x,y,335,100,i===6?C.navy:C.light);txt(s,v,x+17,y+16,300, seventy(),30,i===6?C.white:C.navy,true);});band(s,'講師がフェーズの区切りで全体の進捗を確認します');}
function seventy(){return 70;}
// 06
{let s=base('ターミナルA・Bの役割分担',0,'PowerShellを2つ開き、AIへの依頼と参加者の操作を分けます');table(s,[['役割','A：Claude Code','B：参加者が直接操作'],['常時起動','Claude Codeのセッション','npm run dev'],['主な作業','調査・計画・実装・下書き','ブラウザで試遊・npm test'],['PRの提出','承認付きでpush・PR作成／編集','gh pr readyでDraft解除']],[270,555,595],{h:430});band(s,'追加のPowerShellもBとして扱います。Claude Codeを起動するのはAだけ');}
// 07
{let s=base('担当ゲームと編集できる範囲',0,'担当・ゲームID・Issue番号をメモします。相違があればharness/config.jsonを優先');let config=JSON.parse(await fs.readFile(path.join(root,'harness/config.json'),'utf8'));table(s,[['担当','ゲーム','ゲームID','難易度','Issue'],...config.participants.map(g=>[g.displayName,g.name,g.gameId,{easy:'初級',normal:'中級',hard:'上級'}[g.difficulty],`#${g.issue}`])],[160,360,440,220,240],{y:230,h:465,size:27});band(s,'編集できるのは src/games/<ゲームID>/ の中だけ');}
// 08
{let s=base('フェーズ1｜ツール・認証・クローン',1,'目的：共有リポジトリへアクセスできる環境を用意する');rows(s,['Node.js 22.x・Git・GitHub CLIをインストールし、バージョンを確認','リポジトリへの招待を承諾し、gh auth login でログイン','gh auth status と gh repo view で認証・アクセスを確認','リポジトリをcloneし、git statusでmain・変更なしを確認'],{step:110});band(s,'参加者が操作：GitHub.com → HTTPS → Login with a web browser');}
// 09
{let s=base('フェーズ1｜Claude Codeを起動',1,'参加者が操作：クローンしたcard_arcadeフォルダで起動します');code(s,'cd [任意のフォルダ]/card_arcade\nclaude',115,255,1370,120);rows(s,['このPowerShellを「ターミナルA」として使う','起動時の「今のセッションの前提」を確認する','最初は「担当未設定 ⋅ main ⋅ 変更なし」で問題ない'],{y:442,step:82,size:33});band(s,'担当情報は、フェーズ3でブランチを作成して起動し直すと反映されます');}
// 10
{let s=base('フェーズ1｜環境確認後にサーバーを起動',1,'npm ciの完了を待ってから、ターミナルBを操作します');cols(s,[['A：Claude Codeへ依頼','1. npm ci\n2. npm run doctor\n\n✗ があれば修正せず停止'],['B：参加者が操作','3. npm run dev\n4. localhost:5173を開く\n5. ハイ＆ローを最後まで試遊']]);band(s,'npm installは使わない。doctorの✗行と直下の「→」行をそのまま確認する');}
// 11
{let s=base('フェーズ1｜完了条件',1,'環境チェックと画面確認の両方を終えて、ルール確認へ進みます');cols(s,[['環境・認証','Node.js 22.x／GitHubログイン\nclone直後はmain・変更なし\nClaude Codeの起動案内を確認\ndoctorの9項目に✗がない'],['画面・担当','Bで開発サーバーが動作\n一覧表示・ハイ＆ローの試遊\n担当と編集範囲を記録\nAとBの役割を説明できる']]);band(s,'npm run devは研修終了まで起動。テスト等は追加のBで実行します');}
// 12
{let s=base('フェーズ2｜必須要件と対象外ルールを読む',2,'目的：実装するもの・実装しないものを、原文で確認する');cols(s,[['GitHub Issue','A：本文を全文表示してもらう\n要約・省略・並べ替えはしない\n\n最後に必須要件の件数を確認'],['ゲームのルール文書','docs/games/<ゲームID>.md\n「今回は実装しないルール」\n「時間が足りないときの省略順」\nの内容を原文で確認']]);band(s,'Issue・ルール文書のどちらにも記載がない機能は、実装対象に含めません');}
// 13
{let s=base('フェーズ2｜要件件数を進捗の基準にする',2,'必須要件の件数を数え、実装中もIssueを見られる状態にします');code(s,'gh issue view <Issue番号> --web',115,260,1370, seventy());rows(s,['BでIssueをブラウザ表示する（開発サーバーとは別のPowerShell）','完了条件：Issue本文を省略せず最後まで読んだ','完了条件：必須要件の件数と、対象外ルールを確認した'],{y:395,step:100,size:33});band(s,'実装中は、実装と確認が済んだ必須要件にIssue画面でチェックを入れます');}
// 14
{let s=base('フェーズ3｜ブランチと5つの雛形を用意',3,'目的：実装前に作業場所と提出経路を確認する');cols(s,[['A：順に実行を依頼','git switch main\ngit pull\ngit switch -c feature/<ゲームID>\n担当ゲームのscaffoldを実行\nnpm test'],['生成する5ファイル','index.ts：公開情報\n<Xxx>Game.tsx：画面\nlogic.ts：ルールの純粋関数\nlogic.test.ts：テスト\nREADME.md：遊び方・実装メモ']]);band(s,'実行コマンドは手順書を参照。雛形生成後は /exit → claude で担当表示を確認');}
// 15
{let s=base('フェーズ3｜変更を確認し、Draft PRを作成',3,'A：Claude Codeへ依頼。push・PR作成はコマンドを確認して承認します');rows(s,['git status --short で変更一覧を確認する','担当フォルダだけをaddし、雛形追加のコミットを作成する','git push -u origin HEAD でGitHubへ送信する','Draft PRを作成し、PR番号を記録する'],{step:108});band(s,'Draft＝作業途中のPR。gh pr readyは実行せず、Draftのままにします');}
// 16
{let s=base('フェーズ3｜CI成功を確認して実装へ進む',3,'CIはGitHub上で実行される自動チェックです。失敗を解消してから進みます');code(s,'gh pr checks <自分のPR番号> --watch\ngh pr view <自分のPR番号>',115,247,1370,114,33);cols(s,[['画面・ファイルの確認','担当名・ゲーム名を表示\n担当フォルダに5ファイル\n一覧に「準備中」を表示'],['提出経路の確認','push成功・Draft PR作成\nPR番号を記録・verify成功\n担当外ファイルをcommitしていない']],435);band(s,'CI失敗時は原因を確認。403エラーは招待の承諾状況を講師に相談します');}
// 17
{let s=base('フェーズ4｜実装計画を必須要件と照合',4,'目的：仕様に合う計画を確認し、最後まで遊べる実装につなげる');rows(s,['Aへ依頼：Issueとルール文書を読み、実装計画だけを作成する','参加者が確認：必須要件を上から1件ずつ計画と照合する','不足があれば追記、仕様にないルールがあれば計画から除く','計画が一致したら実装を依頼する。発展課題には着手しない'],{step:110});band(s,'計画の確認中は「まだコードを書かない・ファイルを変更しない」を維持');}
// 18
{let s=base('フェーズ4｜実装後にテストと試遊を行う',4,'B：npm testを実行し、ブラウザをF5で再読み込みして操作します');cols(s,[['参加者が行うこと','最初から最後までの試遊を試す\n停止・白画面・未決着を記録\n確認済みの必須要件にチェック\n不具合はフェーズ5で修正'],['完了条件','計画と必須要件を照合済み\nnpm testが成功\n担当ゲームを表示・操作できる\n変更が担当フォルダ内に収まる']]);band(s,'担当外の変更があれば元に戻すよう依頼し、変更一覧を再確認します');}
// 19
{let s=base('フェーズ5｜3つの観点で動作を検証',5,'目的：不具合を見つけ、同じ操作で修正結果を確認する');cols(s,[['正常操作','最初から最後まで\n途中で止めずに遊ぶ\n\n正しく決着するか確認'],['無効な操作','CPUの手番中に連打\n出せないカードを選択\n山札0枚で引く\n\n状態が変わらないか確認'],['リセット','ゲームをリセットして\n2回目を開始する\n\n初期状態に戻るか確認']]);band(s,'1人用ゲームはCPU関連を省き、そのゲームで無効になる操作を試します');}
// 20
{let s=base('フェーズ5｜不具合は事実と期待を伝える',5,'Aで/planに切り替え、原因と改善策の計画を確認してから修正します');code(s,'起きたこと：<ブラウザで発生したこと>\n期待する動作：<本来どう動くべきか>\n依頼：原因と改善策を計画。まだファイルは変更しない',115,250,1370,175,34);rows(s,['参加者が計画を読み、報告した不具合に対応しているか確認','計画に沿った修正を依頼','Bで再読み込みし、同じ操作で不具合が再現しないか確認'],{y:477,step:78,size:32});band(s,'試す → 記録する → 計画を確認する → 修正する → 同じ操作で確かめる');}
// 21
{let s=base('フェーズ5｜必須要件を満たし、readyにする',5,'最後まで遊べるようになったら、残りの必須要件を確認します');rows(s,['Aへ依頼：未実装の必須要件を一覧にし、上から順に実装する','実装後にnpm testを実行し、結果を確認する','全必須要件を満たしたら、index.tsのstatusだけを"ready"にする','変更後に再度npm testを実行する'],{step:108});band(s,'完了条件：一通りの試遊・無効操作・不具合解消・テスト成功・全必須要件の充足');}
// 22
{let s=base('フェーズ6｜verifyで提出前の検証を行う',6,'目的：変更範囲・コード・動作・ビルドをまとめて確認する');code(s,'npm run verify',115,250,1370, seventy(),40);const a=['範囲チェック','lint','型チェック','テスト','ビルド'];a.forEach((v,i)=>{let x=100+i*287;rect(s,x,435,258,100,C.light);txt(s,v,x+12,457,236,50,32,C.navy,true);if(i<4)txt(s,'→',x+250,453,55,50,24,C.teal);});txt(s,'担当範囲',110,567,250,50,29,C.muted);txt(s,'記述ルール',399,567,250,50,29,C.muted);txt(s,'型の整合',686,567,250,50,29,C.muted);txt(s,'テスト結果',973,567,250,50,29,C.muted);txt(s,'配布用生成',1260,567,250,50,29,C.muted);band(s,'verifyが失敗したらそこで停止し、最初のエラーだけを報告してもらいます');}
// 23
{let s=base('フェーズ6｜実際の変更に基づいてPRを更新',6,'A：verify成功後、手順書の順序でコミット・push・本文更新を依頼します');cols(s,[['変更を送信する','担当フォルダだけをgit add\nゲーム実装のコミットを作成\ngit pushを確認・承認'],['本文を更新する','git diff origin/main...HEADを確認\nPRテンプレートに沿って作成\n.pr-body.mdへ保存\ngh pr editの実行を確認・承認']]);band(s,'未達の必須要件があれば「発展課題・未対応事項」に明記。AではDraft解除しない');}
// 24
{let s=base('フェーズ6｜参加者がDraftを解除して提出',6,'B：提出を判断し、Draftを解除してからCIを確認します');code(s,'gh pr ready <自分のPR番号>\ngh pr checks <自分のPR番号> --watch',115,255,1370,115,34);rows(s,['完了条件：npm run verifyが成功している','完了条件：Draftを解除し、CIのverifyが成功している','完了条件：講師へPR番号を伝えた'],{y:447,step:87,size:34});band(s,'ローカルの検証結果と、GitHub上のCI結果の両方を確認します');}
// 25
{let s=base('フェーズ7｜講師がマージし、公開する',7,'目的：各ゲームの変更をmainへ統合し、公開先で結果を確認する');cols(s,[['参加者','BでPRのCIを確認\nverify失敗時は原因を修正\n\nマージは実行しない'],['講師','9件のPRを順にmainへマージ\nマージごとに自動デプロイ\n\nGitHub PagesのURLを投影']]);band(s,'gh pr checks <自分のPR番号> で確認。verify失敗中のPRはマージできません');}
// 26
{let s=base('フェーズ7｜mainへ同期し、公開を確認',7,'PRがマージされたあと、Aへmainへの同期を依頼します');cols(s,[['A：同期を依頼','git switch main\ngit pull\ngit log --oneline -5\n\n担当ゲームのmainへの反映を確認'],['B：参加者が確認','公開URLで担当ゲームを開始\n手元のブラウザもF5で再読み込み\n\n確認後にCtrl + Cで\n開発サーバーを停止']]);band(s,'完了条件：PRマージ済み・main反映済み・公開先で開始可能・サーバー停止');}
// 27
{let s=base('研修で身につける共同開発の進め方',0,'自分の担当ゲームを例に、次の3点を説明してみましょう');cols(s,[['仕様を確認する','何を実装し、\n何を対象外にしましたか\n\nIssueと計画の対応を説明'],['実装を確かめる','AIの変更を、\nどの操作で\n確認しましたか\n\nテストと試遊の役割'],['変更を共有する','担当の変更は、\nどの工程で\n公開されましたか\n\nPR・CI・マージの関係']]);band(s,'実務でも、実装範囲を決め、計画と動作を確認してから変更を提出する');}
await fs.mkdir(path.join(dir,'renders'),{recursive:true});
const candidate=path.join(dir,'candidate-v2.pptx');
await (await PresentationFile.exportPptx(p)).save(candidate);
console.log('Draft exported: '+p.slides.items.length+' slides');
const result=await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:path.join(root,'.slide-build/validated/final-v3.pptx'),pythonExecutable:path.join(runtime,'python/python.exe'),integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','15240000,8572500','--validate-bullet-geometry','--validate-heading-fit','--require-native-table-slide','6','--require-native-table-slide','7'],explicitTotalSlideCount:27,requiredNativeTableOwnerSlides:[6,7],requiredNativeChartOwnerSlides:[],fontPolicy,verifyArtifactToolImport:true,receiptPath:path.join(dir,'validation-v3.json')});
console.log(JSON.stringify(result));
const final=await PresentationFile.importPptx(await FileBlob.load(path.join(root,'.slide-build/validated/final-v3.pptx')));
for(let i=0;i<final.slides.items.length;i++){const slide=final.slides.items[i];const png=await final.export({slide,format:'png',scale:1});await fs.writeFile(path.join(dir,'renders',`${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()));console.log('Rendered '+(i+1));}



