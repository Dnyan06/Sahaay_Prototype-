// Sign Language Centre: learning path, practice, dictionary and achievements
var signs=[];                       // dictionary lessons from the API
var VID='assets/signs/';
var SG={},POOL={alpha:[],word:[]};  // every sign that has a video
function addSign(id,w,v,o){o=o||{};SG[id]={id:id,w:w,v:v,alpha:!!o.alpha,g:o.g||id,sub:o.sub||'',nq:!!o.nq};POOL[o.alpha?'alpha':'word'].push(id);}
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function(c){addSign(c.toLowerCase(),c,c.toLowerCase(),{alpha:1});});
addSign('hello','Hello','hello',{g:'hello'});addSign('hello2','Hello','hello-2',{g:'hello',sub:'another way'});
addSign('hello-welcome','Hello, welcome','hello-welcome');
addSign('welcome','Welcome','welcome',{g:'welcome'});addSign('welcome-left','Welcome','welcome-left',{g:'welcome',sub:'left hand'});addSign('welcome-right','Welcome','welcome-right',{g:'welcome',sub:'right hand'});
addSign('you','You','you');addSign('me','Me','me');addSign('how','How','how');addSign('fine','Fine','fine');
addSign('question','Question','question',{nq:1});addSign('how-are-you','How are you?','how-are-you');addSign('high-five','Super high five','high-five');

function letters(a,b){return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(a,b).toLowerCase().split('');}
var UNITS=[
 {id:'u1',title:'Introduction',icon:'&#128075;',blurb:'Greetings and first words',chapters:[
  {id:'u1c1',title:'Say hello',sub:'Hello in different ways',signs:['hello','hello2','hello-welcome']},
  {id:'u1c2',title:'Welcome',sub:'Welcome with either hand',signs:['welcome','welcome-left','welcome-right']},
  {id:'u1c3',title:'You and me',sub:'Talking about people',signs:['you','me','how']},
  {id:'u1c4',title:'How are you?',sub:'Ask and answer',signs:['how-are-you','fine','question','high-five']}]},
 {id:'u2',title:'The alphabet',icon:'&#128292;',blurb:'Fingerspell A to Z (videos: ISLRTC)',chapters:[
  {id:'u2c1',title:'Letters A - G',sub:'Your first seven letters',signs:letters(0,7)},
  {id:'u2c2',title:'Letters H - N',sub:'Seven more letters',signs:letters(7,14)},
  {id:'u2c3',title:'Letters O - T',sub:'Six letters',signs:letters(14,20)},
  {id:'u2c4',title:'Letters U - Z',sub:'The last six letters',signs:letters(20,26)}]}];

function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function findChapter(id){var r=null;UNITS.forEach(function(u){u.chapters.forEach(function(c){if(c.id==id)r=c;});});return r;}
function others(s,n){   // wrong answers: different meaning, same kind of sign
  var seen={};seen[s.w]=1;
  return shuffle(POOL[s.alpha?'alpha':'word'].slice()).map(function(i){return SG[i];}).filter(function(x){
    if(x.g==s.g||seen[x.w])return false;seen[x.w]=1;return true;}).slice(0,n);
}
function vid(s,mask,cls){
  return '<div class="sv'+(s.alpha?' wide':'')+(cls||'')+'"><span class="hand">&#9995;</span><video src="'+VID+s.v+'.mp4" autoplay loop muted playsinline onerror="this.style.display=\'none\'"></video>'+(mask&&s.alpha?'<div class="mask"></div>':'')+'</div>';
}
function slowBtn(){return '<button type="button" class="slow" onclick="toggleSlow(this)">&#128034; Slow</button>';}
function toggleSlow(b){
  var on=b.classList.toggle('on');
  document.querySelectorAll('#lesson video, .fc video, #signDetail video').forEach(function(v){v.playbackRate=on?0.5:1;});
}

/* ---------- lesson engine ---------- */
var LS=null;
function buildSteps(ids,learn){
  var ss=ids.map(function(i){return SG[i];}),steps=[],qs=[];
  if(learn)ss.forEach(function(s){steps.push({t:'learn',s:s});});
  ss.filter(function(s){return !s.nq;}).forEach(function(s,i){
    qs.push({t:'mc',s:s});
    if(i<3)qs.push({t:i%2?'find':'tf',s:s});
  });
  return steps.concat(shuffle(qs));
}
function startChapter(id){var c=findChapter(id);openLesson(c,buildSteps(c.signs,true));}
function startPractice(){
  var ids=[],ch=mine.chapters||{};
  UNITS.forEach(function(u){u.chapters.forEach(function(c){if(ch[c.id])ids=ids.concat(c.signs);});});
  if(ids.length<4)ids=Object.keys(SG);
  ids=shuffle(ids.filter(function(i){return !SG[i].nq;})).slice(0,6);
  openLesson({id:'practice',title:'Daily practice'},buildSteps(ids,false).slice(0,8));
}
function openLesson(ch,steps){
  LS={ch:ch,steps:steps,i:0,right:0,asked:0,sel:null,checked:false,done:false,q:null};
  $('lesson').hidden=false;document.body.style.overflow='hidden';drawStep();
}
function closeLesson(){
  if(LS&&!LS.done&&LS.i>0&&!confirm('Leave this lesson? Your progress in it will be lost.'))return;
  $('lesson').hidden=true;document.body.style.overflow='';LS=null;$('lesson').innerHTML='';refreshLearn();
}
function drawStep(){
  if(LS.i>=LS.steps.length){finishLesson();return;}
  var st=LS.steps[LS.i],s=st.s,body='',foot,pct=Math.round(LS.i/LS.steps.length*100);
  LS.sel=null;LS.checked=false;LS.q=null;
  if(st.t=='learn'){
    body='<h2>Learn a new sign!</h2>'+vid(s)+'<div class="word">'+s.w+(s.sub?'<small>'+s.sub+'</small>':'')+'</div>'+slowBtn()+'<p class="hint">Watch it a few times, then copy the sign.</p>';
    foot='<button class="btn big" onclick="nextStep()">Next</button>';
  }else{
    var opts=[],ans=0;
    if(st.t=='mc'){
      var o=[s].concat(others(s,3));shuffle(o);ans=o.indexOf(s);
      body='<h2>'+(s.alpha?'Which letter is this?':'What does this sign mean?')+'</h2>'+vid(s,true)+slowBtn();
      opts=o.map(function(x){return '<button class="opt">'+x.w+'</button>';});
    }else if(st.t=='tf'){
      var truth=Math.random()<.5,shown=truth?s.w:others(s,1)[0].w;ans=truth?0:1;
      body='<h2>True or false?</h2>'+vid(s,true)+'<p class="stmt">'+(s.alpha?'This sign is the letter':'This sign means')+' <b>"'+shown+'"</b></p>';
      opts=['<button class="opt">True</button>','<button class="opt">False</button>'];
    }else{
      var d=others(s,1)[0],pair=shuffle([s,d]);ans=pair.indexOf(s);
      body='<h2>Find the sign for</h2><div class="word">'+s.w+'</div>';
      opts=pair.map(function(x){return '<button class="opt">'+vid(x,true,' sm')+'</button>';});
    }
    LS.q={ans:ans,s:s};
    body+=opts.join('');
    foot='<div id="fb" hidden></div><button class="btn big" id="chk" disabled onclick="checkAnswer()">Check</button>';
  }
  $('lesson').innerHTML='<div class="ltop"><button class="x" onclick="closeLesson()" aria-label="Close lesson">&times;</button><div class="pbar"><i style="width:'+pct+'%"></i></div></div><div class="lb">'+body+'</div><div class="lf">'+foot+'</div>';
  var f=$('lesson').querySelector('.opt,.btn');if(f&&st.t!='learn'&&false)f.focus();
}
$('lesson').addEventListener('click',function(e){
  var b=e.target.closest('.opt');if(!b||!LS||LS.checked||!LS.q)return;
  var all=Array.prototype.slice.call($('lesson').querySelectorAll('.opt'));
  all.forEach(function(x){x.classList.remove('sel');});b.classList.add('sel');
  LS.sel=all.indexOf(b);$('chk').disabled=false;
});
function checkAnswer(){
  var all=$('lesson').querySelectorAll('.opt'),ok=LS.sel==LS.q.ans,fb=$('fb');
  LS.checked=true;LS.asked++;if(ok)LS.right++;
  all[LS.q.ans].classList.add('good');if(!ok)all[LS.sel].classList.add('bad');
  $('lesson').querySelectorAll('.mask').forEach(function(m){m.classList.add('off');});
  fb.hidden=false;fb.className=ok?'ok':'bad';
  fb.textContent=ok?'Correct! Well done.':'Not quite. The right answer is highlighted.';
  var c=$('chk');c.textContent='Next';c.onclick=nextStep;
}
function nextStep(){LS.i++;drawStep();}
function finishLesson(){
  LS.done=true;
  var pct=LS.asked?Math.round(LS.right/LS.asked*100):100,stars=pct?Math.min(5,Math.floor((pct+19)/20)):0;
  var star='&#9733;'.repeat(stars)+'&#9734;'.repeat(5-stars);
  function show(extra){
    $('lesson').innerHTML='<div class="fin"><div class="big-emoji">'+(pct>=80?'&#127881;':pct>=50?'&#128079;':'&#128170;')+'</div><h2>'+(pct>=80?'Great job!':pct>=50?'Good effort!':'Keep practising!')+'</h2><p>You got <b>'+LS.right+'</b> of <b>'+LS.asked+'</b> right ('+pct+'%).</p><div class="stars big">'+star+'</div><p>'+extra+'</p><button class="btn big" onclick="closeLesson()">Continue</button></div>';
  }
  if(!currentUser()){show('Log in to save your stars and daily streak.');return;}
  api('/api/chapters/'+encodeURIComponent(LS.ch.id)+'/complete','POST',{score:pct}).then(function(r){
    mine=r.mine;show('&#128293; '+mine.streak+' day streak');
  }).catch(function(){show('Your result could not be saved. Check your connection.');});
}

/* ---------- tabs ---------- */
function renderPath(){
  var ch=mine.chapters||{},first=null;
  UNITS.forEach(function(u){u.chapters.forEach(function(c){if(!first&&!ch[c.id])first=c.id;});});
  $('tPath').innerHTML=(currentUser()?'':'<div class="note">You can try every lesson without an account. Log in to keep your stars and daily streak.</div><br>')+UNITS.map(function(u){
    return '<div class="unit"><div class="unit-h"><div><b>'+u.title+'</b><br><small>'+u.blurb+' &middot; '+u.chapters.length+' chapters</small></div><span class="uic">'+u.icon+'</span></div>'+
    u.chapters.map(function(c){
      var p=ch[c.id],st=p?p.stars:0;
      return '<div class="chap'+(c.id==first?' next':'')+'"><span class="cic">&#9654;&#65039;</span><div class="cin"><b>'+c.title+'</b><small>'+c.sub+' &middot; '+c.signs.length+' signs</small><span class="stars" aria-label="'+st+' of 5 stars">'+'&#9733;'.repeat(st)+'&#9734;'.repeat(5-st)+'</span></div><button class="btn sm" onclick="startChapter(\''+c.id+'\')">'+(p?'Review':c.id==first?'Start':'Open')+'</button></div>';}).join('')+'</div>';}).join('');
}
var FC=null;
function renderPractice(){
  $('tPractice').innerHTML='<div class="grid"><div class="card"><h3>&#127183; Flashcards</h3><p>Watch the sign, then tap the card to see the word.</p><label>Deck<select id="fcDeck"><option value="all">All signs</option><option value="u1">Introduction</option><option value="u2">The alphabet</option></select></label><button class="btn" onclick="startCards()">Start</button></div>'+
  '<div class="card"><h3>&#9889; Daily practice</h3><p>A quick quiz from the signs you have learned. Finishing it keeps your streak going.</p><button class="btn" onclick="startPractice()">Start quiz</button></div></div><div id="fcBox"></div>';
  if(FC)drawCard();
}
function startCards(){
  var d=$('fcDeck').value,ids=[];
  if(d=='all')ids=Object.keys(SG);else UNITS.forEach(function(u){if(u.id==d)u.chapters.forEach(function(c){ids=ids.concat(c.signs);});});
  FC={ids:shuffle(ids.slice()),i:0,flip:false};drawCard();
}
function drawCard(){
  var s=SG[FC.ids[FC.i]];
  $('fcBox').innerHTML='<p class="small">Card '+(FC.i+1)+' of '+FC.ids.length+'</p><div class="fc" tabindex="0" role="button" onclick="flipCard()" onkeydown="if(event.key==\'Enter\')flipCard()">'+vid(s,!FC.flip)+(FC.flip?'<div class="word">'+s.w+(s.sub?'<small>'+s.sub+'</small>':'')+'</div>':'<p class="hint">Tap to see the word</p>')+'</div><div class="fcn">'+slowBtn()+'<button class="btn out" onclick="moveCard(-1)">Back</button><button class="btn out" onclick="moveCard(1)">Next</button></div>';
}
function flipCard(){FC.flip=!FC.flip;drawCard();}
function moveCard(d){FC.i=(FC.i+d+FC.ids.length)%FC.ids.length;FC.flip=false;drawCard();}
function weekDays(){
  var t=new Date((mine.today||new Date().toISOString().slice(0,10))+'T00:00:00Z'),dow=(t.getUTCDay()+6)%7,out=[];
  for(var i=0;i<7;i++)out.push(new Date(t.getTime()+(i-dow)*864e5).toISOString().slice(0,10));
  return out;
}
function renderAch(){
  if(!currentUser()){$('tAch').innerHTML='<div class="note">Log in to see your streak and achievements.</div>';return;}
  var ch=mine.chapters||{},stars=0,perfect=false;
  Object.keys(ch).forEach(function(k){stars+=ch[k].stars;if(ch[k].stars==5)perfect=true;});
  function unitDone(u){return UNITS.filter(function(x){return x.id==u;})[0].chapters.every(function(c){return ch[c.id];});}
  var badges=[['&#127793;','First lesson',Object.keys(ch).length>=1],['&#128293;','3-day streak',mine.streak>=3],['&#128075;','Introduction complete',unitDone('u1')],['&#128292;','Alphabet master',unitDone('u2')],['&#11088;','Perfect score',perfect],['&#127942;','20 stars',stars>=20]];
  var wk=weekDays(),names='MTWTFSS'.split('');
  $('tAch').innerHTML='<div class="card streak"><div class="flame">&#128293;</div><div><h3>'+mine.streak+' day streak</h3><p>'+(mine.days.indexOf(mine.today)>=0?'You practised today. Nice!':'Finish a lesson today to keep your streak.')+'</p></div><div class="week">'+wk.map(function(d,i){return '<span class="'+(mine.days.indexOf(d)>=0?'on':'')+'" title="'+d+'">'+names[i]+'</span>';}).join('')+'</div></div>'+
  '<div class="stats2"><div class="stat"><b>'+stars+'</b><span>Stars earned</span></div><div class="stat"><b>'+Object.keys(ch).length+'</b><span>Chapters played</span></div><div class="stat"><b>'+mine.learned.length+'</b><span>Dictionary signs learned</span></div></div>'+
  '<h3>Achievements</h3><div class="badges">'+badges.map(function(b){return '<div class="badge2'+(b[2]?'':' lock')+'"><div class="em">'+b[0]+'</div><b>'+b[1]+'</b><br><small>'+(b[2]?'Unlocked':'Locked')+'</small></div>';}).join('')+'</div>';
}
function refreshLearn(){renderPath();renderAch();renderSigns();}
$('learnTabs').onclick=function(e){
  var b=e.target.closest('button');if(!b)return;
  document.querySelectorAll('#learnTabs button').forEach(function(x){x.classList.toggle('on',x==b);});
  document.querySelectorAll('.tab').forEach(function(t){t.hidden=t.id!=b.dataset.t;});
  if(b.dataset.t=='tPath')renderPath();if(b.dataset.t=='tPractice')renderPractice();if(b.dataset.t=='tAch')renderAch();
};

/* ---------- dictionary (lessons from the database) ---------- */
var DICT_VID={'A':'a','B':'b','C':'c','D':'d','E':'e','Hello':'hello','How are you':'how-are-you'};
function renderSigns(){
  var q=$('signQ').value.toLowerCase(),c=$('signCat').value;
  document.querySelectorAll('#signChips button').forEach(function(b){b.classList.toggle('on',b.dataset.c==c);});
  var r=signs.filter(function(s){return (s.t+s.d).toLowerCase().indexOf(q)>=0&&(!c||s.cat==c);});
  $('signList').innerHTML=r.map(function(s){
    var done=mine.learned.indexOf(s.id)>=0;
    return '<button class="card lesson" onclick="openSign('+s.id+')"><span class="tag">'+s.cat+'</span>'+(done?'<span class="tag ok">Learned</span>':'')+'<b class="lt">\u270b '+s.t+'</b><span>'+s.d+'</span></button>';}).join('')||'<p>No signs found.</p>';
}
function openSign(id){
  var s=signs.filter(function(x){return x.id==id;})[0],done=mine.learned.indexOf(id)>=0,f=DICT_VID[s.t];
  var box=$('signDetail');box.hidden=false;
  box.innerHTML='<h3>'+s.t+'</h3>'+(f&&SG[f]?vid(SG[f])+slowBtn():'')+'<p><b>How to sign:</b> '+s.how+'</p><p><b>Example:</b> Use "'+s.d+'" in a daily conversation.</p><button class="btn" onclick="markLearned('+id+')">'+(done?'Learned':'Mark as learned')+'</button>';
  if(box.scrollIntoView)box.scrollIntoView();
}
function markLearned(id){
  if(!currentUser()){alert('Log in to track your progress.');return;}
  api('/api/signs/'+id+'/learn','POST').then(function(r){mine=r.mine;renderSigns();openSign(id);}).catch(fail);
}
function loadSigns(){
  api('/api/signs').then(function(d){
    d.forEach(function(s){s.t=esc(s.t);s.d=esc(s.d);s.how=esc(s.how);});
    signs=d;$('nSigns').textContent=d.length;refreshLearn();
  });
}
document.querySelectorAll('#signChips button').forEach(function(b){b.onclick=function(){$('signCat').value=b.dataset.c;renderSigns();};});
$('signBtn').onclick=renderSigns;$('signQ').oninput=renderSigns;$('signCat').onchange=renderSigns;
renderPath();
