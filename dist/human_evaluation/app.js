'use strict';
const C=window.STUDY_CONFIG;
const $=id=>document.getElementById(id);
const questions=[
 ['scene_consistency','When the camera returns to a place, which video keeps its objects and layout more consistent with the earlier view?'],
 ['temporal_stability','Which video has less flicker and fewer sudden, unnatural changes?'],
 ['overall_quality','Which video has better overall visual quality?']
];
const choices=[['A','Video A'],['B','Video B'],['tie','About the same'],['cannot_judge','Cannot judge']];
const videos=[$('videoA'),$('videoB')];
const storageKey=`${C.studyId}:online`;
let credentials={},accessToken='',state={drafts:{},responses:{}},session,index=0,draft,active=false,playing=false,buffering=false,saving=false,pending=null;
let lastTimes=[0,0],lastWall=0,lastPersist=0;
const msg=text=>{$('message').textContent=text;};
const format=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
const trial=()=>session.trials[index];
const endpoint=path=>`${C.apiBase.replace(/\/$/,'')}${path}`;
function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
function participantKey(){return `${storageKey}:${credentials.nickname?.toLowerCase()}`;}
function screen(name){for(const s of ['gate','welcome','study','complete'])$(s).hidden=s!==name;$('siteHeader').hidden=name==='gate';document.title=name==='gate'?'':'Video comparison study';window.scrollTo(0,0);}
function lock(){snapshot();persist();pause();active=false;accessToken='';screen('gate');$('password').focus();}
async function unlock(e){
 e.preventDefault();$('unlock').disabled=true;msg('');
 try{
  const result=await api('/api/unlock',{method:'POST',data:{password:$('password').value}});
  accessToken=result.access_token;$('password').value='';screen('welcome');$('participant').focus();
 }catch(e){msg(e.message);}finally{$('unlock').disabled=false;}
}
async function api(path,{method='GET',data}={}){
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),25000);
 try{
  const response=await fetch(endpoint(path),{method,headers:{'Content-Type':'application/json',...(credentials.token?{Authorization:`Bearer ${credentials.token}`}:{})},body:data===undefined?undefined:JSON.stringify(data),signal:controller.signal,cache:'no-store'});
  const result=await response.json();
  if(!response.ok){const error=new Error(result.error||'Please try again.');error.status=response.status;throw error;}
  return result;
 }catch(e){if(!e.status)throw new Error('Connection interrupted. Your answer is kept here. Check your connection and retry.');throw e;}
 finally{clearTimeout(timeout);}
}
function persist(){
 if(!credentials.nickname)return;
 if(!write(participantKey(),state))msg('This browser cannot keep unfinished progress. Stay on this page until your answer is saved online.');
}
function snapshot(){
 if(!active)return;
 draft.answers=Object.fromEntries(questions.map(([id])=>[id,document.querySelector(`input[name="${id}"]:checked`)?.value||'']));
 state.drafts[trial().id]=draft;
}
function pause(){playing=false;buffering=false;videos.forEach(v=>v.pause());$('play').textContent='▶ Play both';}
async function play(){
 if(videos.some(v=>v.error)){msg('Video could not load. Refresh the page and resume this set. Your saved answers are safe.');return;}
 if(videos[0].currentTime>=59.8)videos.forEach(v=>v.currentTime=0);
 playing=true;$('play').textContent='Ⅱ Pause';
 try{await Promise.all(videos.map(v=>v.play()));}catch(e){if(e.name==='AbortError')return;pause();msg('Playback could not start. Try Play both again.');}
}
function ready(){
 const watched=draft.watched.every(a=>new Set(a).size>=57);
 $('submit').disabled=!watched||saving;
 $('submit').title=watched?'':'Watch both videos before saving.';
 $('previous').disabled=index===0||saving;
 $('leave').disabled=saving;
}
function render(){
 pause();active=true;const t=trial();
 draft=structuredClone(state.drafts[t.id]||t.response||state.responses[t.id]||{answers:{},watched:[[],[]],speed_changes:[],started_at:new Date().toISOString()});
 $('batchLabel').textContent='Video comparison';
 $('progressLabel').textContent=`Pair ${index+1} of ${session.trials.length}`;
 $('progress').max=session.trials.length;$('progress').value=session.trials.filter(t=>t.response).length;
 $('submit').textContent=index===session.trials.length-1?'Save & finish →':'Save & next →';
 $('questions').replaceChildren();
 for(const [id,title] of questions){
  const fs=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=title;fs.append(legend);
  const options=document.createElement('div');options.className='options';
  for(const [value,label] of choices){const l=document.createElement('label');l.className='option';const input=document.createElement('input');input.type='radio';input.name=id;input.value=value;input.required=true;input.checked=draft.answers[id]===value;l.append(input,document.createTextNode(label));options.append(l);}
  fs.append(options);$('questions').append(fs);
 }
 videos.forEach((v,i)=>{v.src=endpoint(t[i===0?'a':'b']);v.load();v.playbackRate=Number($('speed').value);});
 draft.speed_changes??=[];recordSpeed();lastTimes=[0,0];lastWall=performance.now();$('seek').value=0;$('time').textContent='0:00 / 1:00';
 $('saveStatus').textContent=t.response?'Saved online':'';msg('');ready();screen('study');
}
async function loadSession(){
 session=await api('/api/session',{method:'POST',data:{}});
 if(!session.trials.length){active=false;$('completeMessage').textContent='There are no more comparisons available for you right now. Thank you for helping.';screen('complete');return;}
 index=session.trials.findIndex(t=>!t.response);if(index<0)index=0;
 for(const t of session.trials)if(t.response)state.responses[t.id]=t.response;
 persist();render();
}
async function start(e){
 e.preventDefault();$('start').disabled=true;msg('Signing in…');
 const nickname=$('participant').value.normalize('NFC').trim();
 const saved=read(`${storageKey}:credentials:${nickname.toLowerCase()}`);
 try{
  credentials=await api('/api/login',{method:'POST',data:{nickname,access_token:accessToken,resume_secret:saved?.resume_secret}});
  const stored=write(`${storageKey}:credentials:${credentials.nickname.toLowerCase()}`,credentials);
  write(`${storageKey}:lastNickname`,credentials.nickname);
  if(!stored)msg('Browser storage is unavailable. Keep this tab open to finish your set.');
  state=read(participantKey())||{drafts:{},responses:{}};
  await loadSession();
 }catch(e){if(e.status===401)lock();msg(e.message);}finally{$('start').disabled=false;}
}
async function submit(e){
 e?.preventDefault();if(saving||!active)return;snapshot();persist();
 if(!draft.watched.every(a=>new Set(a).size>=57)||!questions.every(([q])=>choices.some(([c])=>c===draft.answers[q])))return;
 const t=trial(),payload=structuredClone(draft);pending={id:t.id,payload};saving=true;ready();pause();$('saveStatus').textContent='Saving…';msg('');
 try{
  await api(`/api/answers/${encodeURIComponent(t.id)}`,{method:'PUT',data:payload});
  t.response=payload;state.responses[t.id]=payload;delete state.drafts[t.id];persist();pending=null;saving=false;
  if(index+1<session.trials.length){index++;render();}
  else{pause();active=false;$('completeMessage').textContent='Your answers have been saved. You can finish here or evaluate another set.';screen('complete');}
 }catch(e){
  saving=false;$('saveStatus').textContent='Not saved online yet';ready();msg(e.message);
  if(e.status===401){lock();msg('Please enter the password again, then use the same nickname. Your answer is kept in this browser.');}
 }
}
function home(){snapshot();persist();pause();active=false;screen('welcome');msg('');}
function recordSpeed(){draft.speed_changes.push({at_video_seconds:videos[0].currentTime,rate:Number($('speed').value)});draft.speed_changes=draft.speed_changes.slice(-500);}
$('participant').value=read(`${storageKey}:lastNickname`)||'';
$('unlockForm').onsubmit=unlock;
$('startForm').onsubmit=start;$('ratingForm').onsubmit=submit;
$('ratingForm').onchange=()=>{snapshot();persist();$('saveStatus').textContent='Draft kept on this device';};
$('play').onclick=()=>playing?pause():play();
$('restart').onclick=()=>{pause();videos.forEach(v=>v.currentTime=0);lastTimes=[0,0];play();};
$('seek').oninput=()=>{pause();videos.forEach(v=>v.currentTime=Number($('seek').value));lastTimes=videos.map(v=>v.currentTime);$('time').textContent=`${format(videos[0].currentTime)} / 1:00`;};
$('speed').oninput=()=>{const rate=Number($('speed').value);videos.forEach(v=>v.playbackRate=rate);$('speedValue').value=`${rate}×`;lastTimes=videos.map(v=>v.currentTime);lastWall=performance.now();if(active){recordSpeed();snapshot();persist();}};
$('previous').onclick=()=>{if(saving)return;snapshot();persist();if(index>0){index--;render();}};
for(const id of ['leave','finish'])$(id).onclick=home;
$('another').onclick=async()=>{$('another').disabled=true;try{await loadSession();}catch(e){msg(e.message);}finally{$('another').disabled=false;}};
document.querySelectorAll('.expand').forEach(b=>b.onclick=()=>videos[b.dataset.side==='a'?0:1].requestFullscreen?.().catch(()=>{}));
videos.forEach(v=>{
 v.onended=()=>pause();
 v.onerror=()=>{pause();msg('Video could not load. Refresh and resume this set. Your saved answers are safe.');};
 v.onwaiting=()=>{if(playing){buffering=true;videos.forEach(x=>x.pause());$('play').textContent='Loading both…';}};
 v.oncanplay=()=>{if(playing&&buffering&&videos.every(x=>x.readyState>=3)){buffering=false;Promise.all(videos.map(x=>x.play())).catch(e=>{if(e.name!=='AbortError')pause();});$('play').textContent='Ⅱ Pause';}};
});
setInterval(()=>{
 if(!active)return;
 const current=performance.now(),wall=(current-lastWall)/1000,times=videos.map(v=>v.currentTime);
 if(playing&&!buffering&&!document.hidden&&videos.every(v=>!v.paused&&!v.seeking)){
  times.forEach((t,i)=>{const delta=t-lastTimes[i];if(delta>0&&delta<wall*videos[i].playbackRate+0.2&&wall<0.7){for(let s=Math.floor(lastTimes[i]);s<=Math.floor(t);s++)if(s>=0&&s<60&&!draft.watched[i].includes(s))draft.watched[i].push(s);}});
  if(Math.abs(times[0]-times[1])>0.15)videos[1].currentTime=times[0];
 }
 lastTimes=times;lastWall=current;$('seek').value=times[0];$('time').textContent=`${format(times[0])} / 1:00`;ready();
 if(current-lastPersist>5000){snapshot();persist();lastPersist=current;}
},150);
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();snapshot();persist();}});
window.addEventListener('beforeunload',()=>{snapshot();persist();});
window.addEventListener('online',()=>{if(pending&&active&&trial().id===pending.id&&!saving)submit();});
