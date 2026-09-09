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
