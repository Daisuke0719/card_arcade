import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {Presentation, PresentationFile, FileBlob} from '@oai/artifact-tool';
const root='C:/Users/daisu/project/card_arcade';
const dir=path.join(root,'.slide-build');
const skill='C:/Users/daisu/.codex/plugins/cache/openai-primary-runtime/presentations/26.904.11930/skills/presentations';
const runtime='C:/Users/daisu/.cache/codex-runtimes/codex-primary-runtime/dependencies';
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')));
const p=await PresentationFile.importPptx(await FileBlob.load(path.join(root,'output/card-arcade-training-expanded.pptx')));
const original=[...p.slides.items];
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
const added=[];
function make(title,sub){const s=base(title,1,sub);added.push(s);return s;}
function link(s,label,url,y){const t=txt(s,label,110,y,1350,52,32,C.teal);t.text.get(label).link={uri:url,isExternal:true};}
let s=make('フェーズ1｜必要なツールのインストール','参加者が操作：公式サイトからWindows用インストーラーを入手します');
txt(s,'Node.js 22.x：22系のWindows用 .msi を選択して実行',110,230,1380,55,34,C.navy,true);
link(s,'https://nodejs.org/','https://nodejs.org/',292);
txt(s,'Git for Windows：Windows用をダウンロードして実行',110,380,1380,55,34,C.navy,true);
link(s,'https://git-scm.com/download/win','https://git-scm.com/download/win',442);
txt(s,'GitHub CLI：Windows用 .msi をダウンロードして実行',110,530,1380,55,34,C.navy,true);
link(s,'https://cli.github.com/','https://cli.github.com/',592);
band(s,'3つのインストールが終わったら、PowerShellを開き直します');
s=make('フェーズ1｜インストール結果の確認','参加者が操作：スタートメニューで「PowerShell」を検索して開きます');
txt(s,'下のコマンドを1行ずつ入力し、Enterで実行します。',110,230,1380,55,34);
code(s,'node -v\ngit --version\ngh --version',110,320,1380,170,38);
rows(s,['node -v：v22. で始まる番号が表示される','git --version／gh --version：それぞれの番号が表示される'],{y:545,step:80,size:32});
band(s,'「認識されません」と出たら、導入状況を確認してPowerShellを開き直します');
s=make('フェーズ1｜GitHubの招待承諾とログイン','参加者が操作：まず、講師から届いたリポジトリの招待をブラウザで承諾します');
txt(s,'招待先：Daisuke0719/card_arcade',110,230,1380,55,34,C.navy,true);
code(s,'gh auth login',110,325,1380,65,38);
rows(s,['GitHub.com を選択','HTTPS を選択','Login with a web browser を選択し、表示されたコードをブラウザに入力'],{y:455,step:85,size:32});
band(s,'ブラウザで認証を完了したら、PowerShellに戻ります');
s=make('フェーズ1｜認証とアクセス権の確認','参加者が操作：ログイン後、同じPowerShellで上から順に実行します');
code(s,'gh auth status\ngh repo view Daisuke0719/card_arcade --json name',110,255,1380,125,36);
rows(s,['gh auth status：Logged in to github.com と表示される','Token scopes に repo が含まれる','gh repo view：リポジトリ名 card_arcade が表示される'],{y:455,step:86,size:32});
band(s,'403エラーが出たら、招待の承諾状況を確認してから再実行します');
s=make('フェーズ1｜Gitクローンで作業用コピーを作成','参加者が操作：保存先をユーザーフォルダ配下の card-arcade-work にする例です');
txt(s,'同じPowerShellで、以下を上から1行ずつ実行します。',110,235,1380,55,34);
code(s,'New-Item -ItemType Directory -Force "$HOME/card-arcade-work"\ncd "$HOME/card-arcade-work"\ngit clone https://github.com/Daisuke0719/card_arcade.git\ncd card_arcade\ngit status',110,325,1380,260,34);
txt(s,'$HOME は自分のユーザーフォルダを表します。置き換えは不要です。',110,630,1380,55,32);
band(s,'クローンは初回だけ実行します。以降は作成済みのフォルダへ移動します');
s=make('フェーズ1｜クローン結果と現在地の確認','参加者が操作：クローン直後の card_arcade フォルダで実行します');
code(s,'Get-Location\nGet-Item package.json, CLAUDE.md\ngit status',110,250,1380,165,36);
rows(s,['現在地の末尾が card-arcade-work\\card_arcade になっている','package.json と CLAUDE.md の2つが表示される','On branch main と nothing to commit, working tree clean が表示される'],{y:465,step:87,size:32});
band(s,'別の保存先を使った場合は、以降のcdを自分の保存先に置き換えます');
s=make('フェーズ1｜Claude Codeが未導入の場合','参加者が操作：PowerShellで確認し、未導入の場合のみインストールします');
code(s,'claude --version',110,255,1380,65,36);
txt(s,'バージョンが表示されれば、次のスライドへ進みます。',110,355,1380,55,32);
txt(s,'認識されない場合：公式インストーラーを実行します。',110,445,1380,55,32,C.navy,true);
code(s,'irm https://claude.ai/install.ps1 | iex',110,530,1380,65,36);
txt(s,'完了後にPowerShellを開き直し、claude --version を再実行します。',110,650,1380,55,32);
link(s,'補足出典：Claude Code公式インストール手順','https://code.claude.com/docs/en/setup',755);
const first=[...added];
s=make('フェーズ1｜ターミナルBで開発サーバーを起動','参加者が操作：npm ciの完了とdoctorの成功を確認してから進みます');
txt(s,'PowerShellをもう1つ開きます。この新しい画面がターミナルBです。',110,235,1380,55,32);
code(s,'cd "$HOME/card-arcade-work/card_arcade"\nnpm run dev',110,340,1380,120,36);
rows(s,['起動ログに http://localhost:5173/ が表示されることを確認','この画面は開いたままにし、研修終了までサーバーを動かす'],{y:530,step:85,size:32});
band(s,'別のコマンドを使うときは、PowerShellを追加で開きます（追加のB）');
s=make('フェーズ1｜ブラウザで一覧表示と試遊を確認','参加者が操作：ブラウザのアドレス欄に次のURLを入力します');
code(s,'http://localhost:5173/',110,255,1380,70,42);
rows(s,['CARD ARCADEのゲーム一覧が表示されることを確認','サンプルの「ハイ＆ロー」を開く','最後まで1回遊び、結果まで確認する'],{y:405,step:95,size:34});
band(s,'表示されない場合は、ターミナルBの起動ログとエラーを確認します');
function change(n,a,b){let sh=original[n-1].shapes.items.find(s=>s.text.toString()===a);if(!sh)throw Error(a);sh.text=b;}
change(15,'フェーズ1｜ツール・認証・クローン','フェーズ1｜環境構築の全体像');
change(16,'cd [任意のフォルダ]/card_arcade\nclaude','cd "$HOME/card-arcade-work/card_arcade"\nclaude');
change(16,'このPowerShellを「ターミナルA」として使う','初回は画面の案内に従ってログインし、この画面をターミナルAにする');
const order=[...original.slice(0,15),...first,original[15],original[16],original[17],...added.slice(7),...original.slice(18)];
for(let i=0;i<order.length;i++){order[i].moveTo(i);const sh=order[i].shapes.items.find(s=>s.position.left>=1450 && s.position.top>=840);if(sh)sh.text=String(i+1).padStart(2,'0');}
const out=path.join(root,'output/card-arcade-training-phase1-detailed.pptx');
const candidate=path.join(dir,'phase1-candidate.pptx');
await (await PresentationFile.exportPptx(p)).save(candidate);
const tableOwners=[6,10,12,13];
await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:out,pythonExecutable:path.join(runtime,'python/python.exe'),integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','15240000,8572500','--validate-bullet-geometry','--validate-heading-fit',...tableOwners.flatMap(n=>['--require-native-table-slide',String(n)])],explicitTotalSlideCount:66,requiredNativeTableOwnerSlides:tableOwners,requiredNativeChartOwnerSlides:[],fontPolicy,verifyArtifactToolImport:true,receiptPath:path.join(dir,'phase1-validation.json')});
const final=await PresentationFile.importPptx(await FileBlob.load(out));
await fs.mkdir(path.join(dir,'phase1-renders'),{recursive:true});
for(let i=0;i<66;i++){const png=await final.export({slide:final.slides.items[i],format:'png',scale:1});await fs.writeFile(path.join(dir,'phase1-renders',String(i+1).padStart(2,'0')+'.png'),new Uint8Array(await png.arrayBuffer()));console.log('Rendered '+(i+1));}

