import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {Presentation, PresentationFile, FileBlob} from '@oai/artifact-tool';
const root='C:/Users/daisu/project/card_arcade';
const dir=path.join(root,'.slide-build');
const skill='C:/Users/daisu/.codex/plugins/cache/openai-primary-runtime/presentations/26.904.11930/skills/presentations';
const runtime='C:/Users/daisu/.cache/codex-runtimes/codex-primary-runtime/dependencies';
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')));
const p=await PresentationFile.importPptx(await FileBlob.load(path.join(root,'output/card-arcade-training.pptx')));
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
const order=[];
const promptRecords=[];
const blocks=JSON.parse(await fs.readFile(path.join(dir,'prompts.json'),'utf8'));
const live=JSON.parse(await fs.readFile(path.join(dir,'issues-live.json'),'utf8'));
function old(n){order.push(original[n-1]);}
function add(s){order.push(s);return s;}
function line(s,x,y,w,h,color=C.teal){rect(s,x,y,w,h,color);}
function dot(s,x,y,size=25,color=C.teal){s.shapes.add({geometry:'ellipse',position:{left:x,top:y,width:size,height:size},fill:C.white,line:{fill:color,width:5}});}
function icon(s,type,x,y,z=1){
 const r=(a,b,w,h,c=C.teal)=>line(s,x+a*z,y+b*z,w*z,h*z,c);
 const d=(a,b)=>dot(s,x+a*z,y+b*z,24*z);
 if(type==='issue'){r(0,0,6,125);r(0,0,100,6);r(94,0,6,125);r(0,119,100,6);for(let i=0;i<3;i++){d(15,24+i*28);r(49,34+i*28,31,5);}}
 if(type==='branch'){r(21,18,5,102);r(21,66,76,5);r(92,28,5,43);d(11,0);d(11,108);d(82,5);}
 if(type==='pr'){r(13,13,5,100);r(13,60,87,5);r(95,25,5,40);d(3,0);d(3,105);d(85,8);s.shapes.add({geometry:'rightArrow',position:{left:x+48*z,top:y+49*z,width:38*z,height:27*z},fill:C.teal,line:{fill:'none',width:0}});}
 if(type==='check'){r(0,0,100,6);r(0,0,6,110);r(94,0,6,110);r(0,104,100,6);txt(s,'✓',x+18*z,y+18*z,82*z,82*z,65*z,C.teal,true);}
}
function source(s,label,url){txt(s,`出典：${label}`,100,788,1380,32,18,C.muted);const t=s.shapes.items.at(-1);t.text.hyperlink=url;}
const docIssues='https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/about-issues';
const docBranches='https://docs.github.com/en/pull-requests/reference/branches';
const docPR='https://docs.github.com/en/pull-requests/reference/pull-requests';
function explanation(title,type,definition,items,foot,url){const s=add(base(title,0,definition));icon(s,type,130,285,1.45);items.forEach((a,i)=>{let y=240+i*155;txt(s,a[0],390,y,1100,60,36,C.navy,true);txt(s,a[1],390,y+65,1100,80,32);});source(s,foot,url);return s;}
function prompt(phase,index,title,note=''){return promptText(phase,blocks[phase][index],title,note);}
function visualWidth(t){return Array.from(t).reduce((n,c)=>n+(/[\u0020-\u007e]/.test(c)?(/[:.,!ilI| ']/.test(c)?10:20):33),0);}
function promptText(phase,body,title,note=''){
 const chunks=[];let chunk=[],used=0;
 for(const raw of body.split('\n')){const height=raw.trim()?Math.max(1,Math.ceil(visualWidth(raw)/1350))*44:19;if(used+height>478&&chunk.length){chunks.push(chunk);chunk=[];used=0;}chunk.push({raw,height});used+=height;}
 if(chunk.length)chunks.push(chunk);
 const pieces=[];
 chunks.forEach((part,i)=>{const s=add(base(`フェーズ${phase}｜${title}${chunks.length>1?` ${i+1}/${chunks.length}`:''}`,phase,'ターミナルA：Claude Codeに入力するプロンプト（全文）'));rect(s,90,228,1420,493,'#F1F5F8');let y=244;part.forEach(l=>{if(l.raw.trim())txt(s,l.raw,111,y,1380,l.height+9,32,C.navy);y+=l.height;});
 const guide=chunks.length>1?'複数ページで1つのプロンプトです。全ページの本文をまとめて入力してください。':note||((phase>=3&&phase<=6)?'実際の入力は、担当Issueの該当するコードブロックをコピーしてください。':'<…> は担当情報や実際に起きたことに置き換えて入力します。');
 txt(s,guide,100,738,1400, forty(),26,C.teal,true);
 if(note&&chunks.length>1)txt(s,note,100,788,1400,32,21,C.muted);
 pieces.push(s);});
 promptRecords.push({phase,title,body,pieces});return pieces;
}
function forty(){return 40;}
function issueGuide(phase,sections,what){const s=add(base(`フェーズ${phase}｜担当Issueを参照して進める`,phase,'Issueの「進め方（フェーズ3〜6）」には、担当ゲーム用のプロンプトが用意されています'));icon(s,'issue',118,262,1.2);txt(s,'今回、開く見出し',335,242,1150,60,37,C.navy,true);txt(s,sections,335,310,1150,150,34);txt(s,'確認する内容',335,478,1150,55,35,C.navy,true);txt(s,what,335,544,1135,135,32);band(s,'Bで gh issue view <Issue番号> --web を実行し、担当Issueを開いてください');return s;}
old(1);old(2);old(3);old(4);
explanation('GitHub Issue｜要件・課題・進捗を記録する','issue','「何を作るか」「何が完了したか」を関係者と共有する、GitHubの機能です。',[
 ['タイトルと本文で、作業内容を明確にする','機能追加や不具合を1件の課題として記録し、要件・背景・完了条件を整理します。'],
 ['担当・ラベル・コメントで、作業を整理する','担当者を示し、種類を分類し、質問や判断の経緯を残せます。'],
 ['チェックリストと状態で、進み具合を確認する','研修では必須要件のチェックを更新し、PRから対応するIssueを参照します。']
 ],'GitHub Docs「About issues」',docIssues);
{let s=add(base('担当Issueの読み方｜ババ抜きの例',0,'画面の再現ではなく、Issue #1の内容を説明用に整理した図です'));icon(s,'issue',115,267,1.05);table(s,[['読む場所','確認する内容'],['担当','担当1／feature/babanuki／編集範囲'],['進め方（フェーズ3〜6）','担当情報が入ったプロンプト'],['必須要件','例：配札直後に同じランクのペアを捨てる'],['完了条件','試遊・リセット・テスト・PR提出']],[430,780],{x:285,y:245,h:420,size:30});txt(s,'要件を読む → 実装する → 動作を確認する → チェックを入れる',110,717,1380,65,32,C.teal,true);source(s,'担当1：ババ抜き（Issue #1）',live.find(i=>i.number===1).url);}
explanation('ブランチ｜変更履歴を分けて開発する','branch','mainから作業用の履歴を分岐させ、担当ゲームの変更を進めます。',[
 ['mainは、統合されたコードの基準','研修ではmainからfeature/<ゲームID>を作成し、作業先を切り替えます。'],
 ['作業ブランチに変更を記録する','Commitで変更履歴を残し、PushでGitHub上の同じブランチへ送信します。'],
 ['PRを通して、mainへ統合する','ブランチを作るだけではmainは変わりません。講師のマージで反映されます。']
 ],'GitHub Docs「Branches」／研修手順書',docBranches);
{let s=add(base('ブランチの流れ｜分岐・変更・統合',0,'例：ババ抜きの変更をfeature/babanukiで進め、講師がmainへ統合します'));txt(s,'main',100,270,230,60,35,C.navy,true);line(s,350,300,1050,7,C.navy);for(const x of [350,630,1040,1380])dot(s,x,288,32,C.navy);line(s,645,306,6,210);line(s,645,510,550,7);line(s,1190,305,6,212);for(const x of [645,835,1030])dot(s,x,497,32);txt(s,'feature/babanuki',620,568,770,55,36,C.teal,true);txt(s,'ブランチ作成',540,368,250,55,30);txt(s,'Commit',804,440,190,50,30);txt(s,'PR・講師がマージ',1070,365,420,60,30,C.navy,true);band(s,'ブランチを分けても、編集してよいのは src/games/babanuki/ の中だけ');}
explanation('Pull Request｜変更を提案し、確認を受ける','pr','作業ブランチの変更をmainへ取り込むための、GitHub上の提案です。',[
 ['変更の理由と内容を説明する','PR本文に実装内容と確認結果を記載し、対応するIssueを示します。'],
 ['差分と検証結果をまとめて確認する','変更ファイル・コミット履歴・コメント・CIの結果を、同じPRで確認できます。'],
 ['確認後にマージする','研修では参加者がDraftを解除して提出し、講師がmainへマージします。']
 ],'GitHub Docs「Pull requests」／研修手順書',docPR);
{let s=add(base('PRの状態と、確認する場所',0,'Draft作成、提出、マージは別の段階です。Pushだけではmainに統合されません。'));const stages=[['Draft','作業途中を共有','フェーズ3'],['Ready for review','参加者が提出','フェーズ6'],['Merged','講師がmainへ統合','フェーズ7']];stages.forEach((a,i)=>{let x=105+i*495;icon(s,i===2?'check':'pr',x,250,.65);txt(s,a[0],x+100,255,375,55,34,C.navy,true);txt(s,a[1],x,359,450,50,32);txt(s,a[2],x,414,450,40,26,C.teal,true);});table(s,[['本文・会話','変更履歴','自動チェック','ファイル差分'],['Conversation','Commits','Checks','Files changed']],[355,355,355,355],{y:520,h:145,size:28});txt(s,'Draft中はマージ不可。提出後も同じブランチへpushすると、PRの差分が更新されます。',100,715,1410,65,29,C.teal,true);source(s,'GitHub Docs「Pull requests」',docPR);}
old(5);old(6);old(7);
{let s=add(base('プロンプトと担当Issueの使い分け',0,'スライドは共通の指示を掲載。実際の入力では、担当Issueの文面を利用します。'));cols(s,[['フェーズ1・2・7','スライドの全文を入力\n<ゲームID>・<Issue番号>などを\n自分の担当情報に置き換える'],['フェーズ3〜6','担当Issueのコードブロックを利用\nゲームID・ブランチ名・Issue番号は\n担当内容に合わせて記載済み']]);txt(s,'<自分のPR番号>・不具合の状況・要件の文言は、実際の内容に置き換えます。',105,635,1390,60,30,C.navy);band(s,'複数ページのプロンプトは、全文をまとめてAに入力。停止条件・禁止事項も残します');}
old(8);old(9);prompt(1,0,'環境準備のプロンプト','doctorに✗が出た場合は、その出力を講師へ共有してから次へ進みます。');old(10);old(11);
old(12);prompt(2,0,'Issue全文を確認する');prompt(2,1,'対象外ルールを確認する');old(13);
issueGuide(3,'「1. ブランチを作成し、雛形を生成する」\n「2. 最初のコミットと Draft の Pull Request 作成」','自分のゲームID・編集範囲・ブランチを確認。\nClosesの番号が担当Issueと一致することも確認します。');
old(14);prompt(3,0,'ブランチ・雛形のプロンプト','完了後は /exit → claude で起動し直し、担当情報の表示を確認します。');old(15);prompt(3,1,'雛形をコミットする');prompt(3,2,'pushとDraft PRを作成する');
promptText(3,'Closes の番号が違います。私の Issue は #<Issue番号> です。そこだけ直してもう一度出してください。','Closesの番号が違う場合','承認画面で番号が違えば n を選択し、この修正依頼を入力します。');old(16);prompt(3,3,'範囲外のaddが原因でCIが失敗した場合','該当する場合のみ入力。担当フォルダの中身は保持します。');
issueGuide(4,'「3. 実装の計画を先に立てる」\n「4. 最後まで遊べる状態にする」','計画と「必須要件」を1件ずつ照合します。\nゲーム固有の作り方は「実装の進め方」も参照します。');
old(17);prompt(4,0,'実装計画を作成する');prompt(4,1,'計画に要件が不足している場合');prompt(4,2,'対象外のルールが含まれる場合');prompt(4,3,'確認した計画で実装する');old(18);prompt(4,4,'担当外のファイルが変更された場合');
issueGuide(5,'「4. 最後まで遊べる状態にする」\n「必須要件」「実装の進め方」「完了条件」','担当ゲームの動作と必須テストを確認。\n不具合の状況と期待する動作は、自分が試した結果を記入します。');
old(19);old(20);prompt(5,0,'不具合の原因と改善策を計画','Aで /plan に切り替えてから入力。計画を確認したあとに修正を依頼します。');old(21);prompt(5,1,'残りの必須要件を実装する','共通の補助プロンプトです。<Issue番号>を自分の担当Issueに置き換えます。');prompt(5,2,'statusをreadyへ変更する');
issueGuide(6,'「5. Pull Request を提出する」\n「必須要件」「完了条件」','提出用プロンプトの<自分のPR番号>を置き換えます。\n差分・検証結果・未対応事項を確認し、参加者がDraftを解除します。');
old(22);old(23);prompt(6,0,'提出のプロンプト','verify失敗時は停止。push・PR本文更新は承認し、Draft解除はBで参加者が行います。');old(24);
old(25);prompt(7,0,'マージ後にmainへ同期する','担当PRのマージを確認してから入力してください。');old(26);old(27);
for(let i=0;i<order.length;i++)order[i].moveTo(i);
// Retain imported slide objects and update their page numbers in place.
for(let i=0;i<p.slides.items.length;i++){
 const s=p.slides.items[i];for(const sh of s.shapes.items){if(sh.position.left>=1450&&sh.position.top>=830){sh.text=String(i+1).padStart(2,'0');}}
}
const tableOwners=p.slides.items.map((s,i)=>s.tables.items.length?i+1:null).filter(Boolean);
await fs.mkdir(path.join(dir,'revision-renders'),{recursive:true});
await fs.writeFile(path.join(dir,'prompt-audit.json'),JSON.stringify(promptRecords.map(r=>({...r,pieces:r.pieces.map(s=>p.slides.items.indexOf(s)+1)})),null,2));
await fs.writeFile(path.join(dir,'revision-index.json'),JSON.stringify(p.slides.items.map((s,i)=>({n:i+1,title:s.shapes.items.find(sh=>sh.position.top===54)?.text.toString()||'表紙'})),null,2));
const candidate=path.join(dir,'revision-candidate.pptx');
await (await PresentationFile.exportPptx(p)).save(candidate);
const finalPath=path.join(root,'output/card-arcade-training-expanded.pptx');
const result=await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath,pythonExecutable:path.join(runtime,'python/python.exe'),integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','15240000,8572500','--validate-bullet-geometry','--validate-heading-fit',...tableOwners.flatMap(n=>['--require-native-table-slide',String(n)])],explicitTotalSlideCount:order.length,requiredNativeTableOwnerSlides:tableOwners,requiredNativeChartOwnerSlides:[],fontPolicy,verifyArtifactToolImport:true,receiptPath:path.join(dir,'revision-validation.json')});
console.log('Validated '+order.length+' slides. '+result.finalPath);
const final=await PresentationFile.importPptx(await FileBlob.load(finalPath));
for(let i=0;i<final.slides.items.length;i++){let s=final.slides.items[i];let png=await final.export({slide:s,format:'png',scale:1});await fs.writeFile(path.join(dir,'revision-renders',String(i+1).padStart(2,'0')+'.png'),new Uint8Array(await png.arrayBuffer()));console.log('Rendered '+(i+1));}

