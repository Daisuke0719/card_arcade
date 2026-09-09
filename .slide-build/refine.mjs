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
function slide(n){return p.slides.items[n-1];}
function replace(n,oldText,newText){const a=slide(n).shapes.items.find(s=>s.text.toString()===oldText);if(!a)throw new Error('Missing text '+oldText);a.text=newText;}
replace(5,'機能追加や不具合を1件の課題として記録し、要件・背景・完了条件を整理します。','機能追加や不具合ごとに、要件・背景・完了条件を整理します。');
replace(5,'研修では必須要件のチェックを更新し、PRから対応するIssueを参照します。','研修では必須要件のチェックを更新し、PRに担当Issueを記載します。');
replace(7,'研修ではmainからfeature/<ゲームID>を作成し、作業先を切り替えます。','mainからfeature/<ゲームID>を作成し、作業先を切り替えます。');
replace(7,'Commitで変更履歴を残し、PushでGitHub上の同じブランチへ送信します。','Commitで変更を記録し、PushでGitHub上のブランチへ送信します。');
replace(7,'ブランチを作るだけではmainは変わりません。講師のマージで反映されます。','mainへの反映は、PRを確認した講師がマージするときに行います。');
replace(9,'変更ファイル・コミット履歴・コメント・CIの結果を、同じPRで確認できます。','変更ファイル・コミット履歴・コメント・CIの結果を確認できます。');
for(const sh of slide(8).shapes.items){let t=sh.text.toString();if(t==='ブランチ作成')sh.position={left:355,top:368,width:275,height:65};if(t==='PR・講師がマージ'){sh.text='PRを確認\n講師がマージ';sh.position={left:1220,top:365,width:300,height:110};}}
slide(8).shapes.add({geometry:'ellipse',position:{left:1177,top:288,width:32,height:32},fill:C.white,line:{fill:C.navy,width:5}});
replace(36,'どの項目で実現するか分かるように、計画へ追記してください。まだ実装はしないでください。','どの項目で実現するか分かるように、計画へ追記してください。\nまだ実装はしないでください。');
replace(40,'実際の入力は、担当Issueの該当するコードブロックをコピーしてください。','共通の補助プロンプトです。<ゲームID>を自分の担当ゲームに置き換えます。');
const links={5:'https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/about-issues',6:'https://github.com/Daisuke0719/card_arcade/issues/1',7:'https://docs.github.com/en/pull-requests/reference/branches',9:'https://docs.github.com/en/pull-requests/reference/pull-requests',10:'https://docs.github.com/en/pull-requests/reference/pull-requests'};
for(const [num,url] of Object.entries(links)){const sh=slide(Number(num)).shapes.items.find(s=>s.text.toString().startsWith('出典：'));sh.text.get(sh.text.toString()).link={uri:url,isExternal:true};}
const issueNums=[1,6,2,8,9,3,4,5,10];for(let r=1;r<=9;r++){const c=slide(13).tables.items[0].getCell(r,4);c.text.get(c.text.toString()).link={uri:`https://github.com/Daisuke0719/card_arcade/issues/${issueNums[r-1]}`,isExternal:true};}
const out=path.join(dir,'validated/expanded-final.pptx');
const candidate=path.join(dir,'expanded-refined-candidate.pptx');
await (await PresentationFile.exportPptx(p)).save(candidate);
const tableOwners=[6,10,12,13];
const result=await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:out,pythonExecutable:path.join(runtime,'python/python.exe'),integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','15240000,8572500','--validate-bullet-geometry','--validate-heading-fit',...tableOwners.flatMap(n=>['--require-native-table-slide',String(n)])],explicitTotalSlideCount:57,requiredNativeTableOwnerSlides:tableOwners,requiredNativeChartOwnerSlides:[],fontPolicy,verifyArtifactToolImport:true,receiptPath:path.join(dir,'expanded-final-validation.json')});
console.log('Finalized '+result.finalPath);
const final=await PresentationFile.importPptx(await FileBlob.load(out));
for(let i=0;i<57;i++){let png=await final.export({slide:final.slides.items[i],format:'png',scale:1});await fs.writeFile(path.join(dir,'revision-renders',String(i+1).padStart(2,'0')+'.png'),new Uint8Array(await png.arrayBuffer()));console.log('Rendered '+(i+1));}

