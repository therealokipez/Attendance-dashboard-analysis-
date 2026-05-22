// AttendiQ — Core app: navigation, login, dashboard, QR system, utilities
/* ═══════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════ */
function show(id){document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('on');});document.getElementById(id).classList.add('on');}

var sideOpen=true;
function toggleSidebar(){
  sideOpen=!sideOpen;
  var s=document.getElementById('dside'),h=document.getElementById('hbg');
  s.classList.toggle('closed',!sideOpen);
  h.classList.toggle('x',sideOpen);
}

/* ═══════════════════════════════════════════
   LOGIN SYSTEM
═══════════════════════════════════════════ */
function goLogin(role){
  var c=RC[role];
  var glows=c.glows.map(function(g){var p='';if(g.t)p+='top:'+g.t+';';if(g.l)p+='left:'+g.l+';';if(g.r)p+='right:'+g.r+';';if(g.b)p+='bottom:'+g.b+';';return'<div style="position:absolute;width:'+g.s+';height:'+g.s+';border-radius:50%;background:'+g.c+';opacity:'+g.o+';filter:blur(120px);'+p+'pointer-events:none"></div>';}).join('');
  document.getElementById('lvisBg').style.cssText='position:absolute;inset:0;background:'+c.visBg;
  document.getElementById('lvisBg').innerHTML=glows;
  document.getElementById('lvisPat').style.cssText=c.pat;
  document.getElementById('lvisFloats').innerHTML=c.floats.map(function(f){return'<div class="fcard" style="top:'+f.t+';right:'+f.r+'"><div class="fc-l">'+f.l+'</div><div class="fc-v"'+(f.vc?' style="color:'+f.vc+'"':'')+'>'+f.v+'</div><div class="fc-s">'+f.s+'</div></div>';}).join('');
  document.getElementById('lvisContent').innerHTML='<div class="lp-eyebrow"><span class="ep-dot"></span>'+c.ey+'</div><div class="lp-headline">'+c.big+'</div><div class="lp-para">'+c.para+'</div><div class="lp-stats">'+c.stats.map(function(s){return'<div><div class="lst-v">'+s.v+'</div><div class="lst-l">'+s.l+'</div></div>';}).join('')+'</div>';
  document.getElementById('lfp').style.background=c.fbg;
  buildLoginPanel(role, c, 'signin');
  show('s-login');
}

function buildLoginPanel(role, c, activeTab){
  var signInHtml=buildSignInForm(role, c);
  var createHtml=buildCreateForm(role, c);
  document.getElementById('fbox').innerHTML=
    '<div class="fb-back" onclick="show(\'s-hub\')">← All roles</div>'+
    '<div class="fb-logo"><div class="fb-mark"><span style="background:'+c.ac+';opacity:.25"></span><span style="background:'+c.ac+'"></span><span style="background:'+c.ac+'"></span><span style="background:'+c.ac+';opacity:.55"></span></div><div class="fb-wordmark">Attendi<em style="color:'+c.ac+'">Q</em></div></div>'+
    '<div class="login-tabs" id="ltabs">'+
      '<div class="ltab '+(activeTab==='signin'?'on':'')+'" id="tab-si" style="'+(activeTab==='signin'?'background:'+c.ac:'')+'" onclick="switchLTab(\'signin\',\''+c.ac+'\')">Sign In</div>'+
      '<div class="ltab '+(activeTab==='create'?'on':'')+'" id="tab-ca" style="'+(activeTab==='create'?'background:'+c.ac:'')+'" onclick="switchLTab(\'create\',\''+c.ac+'\')">Create Account</div>'+
    '</div>'+
    '<div id="tab-si-ct" style="display:'+(activeTab==='signin'?'block':'none')+'">'+signInHtml+'</div>'+
    '<div id="tab-ca-ct" style="display:'+(activeTab==='create'?'block':'none')+'">'+createHtml+'</div>';
}

function buildSignInForm(role, c){
  var titles={student:'Welcome back',lecturer:'Good to see you',advisor:'Welcome, Advisor',admin:'Admin Access',provost:'Welcome, Provost'};
  var subs={student:'Sign in to your student account',lecturer:'Sign in to your faculty account',advisor:'Sign in to your advising portal',admin:'Sign in to the administration portal',provost:'Sign in to your executive provost portal'};
  return '<div class="fb-h">'+titles[role]+'</div>'+
    '<div class="fb-s">'+subs[role]+'</div>'+
    '<div class="fb-chip" style="background:'+c.chip.bg+';border:1px solid '+c.chip.bd+';color:'+c.chip.c+'">'+c.chip.tx+'</div>'+
    '<div class="fb-hint">💡 Demo &nbsp;·&nbsp; <strong>'+c.demo.e+'</strong> / <strong>'+c.demo.p+'</strong></div>'+
    '<label class="fb-lbl">Email address</label>'+
    '<div class="fb-wrap"><input class="fb-in" type="email" id="fi-em" placeholder="you@university.edu" value="'+c.demo.e+'" onfocus="this.style.borderColor=\''+c.ac+'\';this.style.boxShadow=\'0 0 0 3px rgba('+c.rgb+',.12)\'" onblur="this.style.borderColor=\'\';this.style.boxShadow=\'\'"></div>'+
    '<div class="fb-err" id="e-em">Please enter your email</div>'+
    '<label class="fb-lbl" style="margin-top:6px">Password</label>'+
    '<div class="fb-wrap"><input class="fb-in" type="password" id="fi-pw" placeholder="••••••••" value="'+c.demo.p+'" onfocus="this.style.borderColor=\''+c.ac+'\';this.style.boxShadow=\'0 0 0 3px rgba('+c.rgb+',.12)\'" onblur="this.style.borderColor=\'\';this.style.boxShadow=\'\'"><button class="fb-eye" onclick="tvPw(this)">👁</button></div>'+
    '<div class="fb-err" id="e-pw">Incorrect credentials</div>'+
    '<div class="fb-row"><label class="fb-rem"><input type="checkbox" checked style="accent-color:'+c.ac+'"> Remember me</label><div class="fb-fgt" style="color:'+c.ac2+'">Forgot password?</div></div>'+
    '<button class="fb-btn" id="lbtn" style="background:'+c.btnBg+';box-shadow:0 8px 30px '+c.btnSh+'" onclick="doLogin(\''+role+'\')">Sign in to '+role.charAt(0).toUpperCase()+role.slice(1)+' Portal</button>'+
    '<div class="fb-or"><span>or</span></div>'+
    '<button class="fb-sso" onclick="toast(\'🏫 Redirecting to '+c.sso+'...\')">🏫 &nbsp;Continue with '+c.sso+'</button>'+
    '<div class="fb-sw" style="margin-top:14px">← <a style="color:'+c.ac2+';font-weight:700" onclick="show(\'s-hub\')">Choose another role</a></div>';
}

function buildCreateForm(role, c){
  var rLabel=role.charAt(0).toUpperCase()+role.slice(1);
  var extraField='';
  if(role==='student') extraField='<div class="fg"><label class="fb-lbl">Year &amp; Programme</label><div class="fb-wrap"><input class="fb-in" id="reg-extra" placeholder="e.g. Year 1 · Computer Science" onfocus="this.style.borderColor=\''+c.ac+'\'" onblur="this.style.borderColor=\'\'"></div></div>';
  else if(role==='lecturer') extraField='<div class="fg"><label class="fb-lbl">Department &amp; Course</label><div class="fb-wrap"><input class="fb-in" id="reg-extra" placeholder="e.g. Business · BUS 202" onfocus="this.style.borderColor=\''+c.ac+'\'" onblur="this.style.borderColor=\'\'"></div></div>';
  else extraField='<div class="fg"><label class="fb-lbl">Department</label><div class="fb-wrap"><input class="fb-in" id="reg-extra" placeholder="e.g. Student Affairs" onfocus="this.style.borderColor=\''+c.ac+'\'" onblur="this.style.borderColor=\'\'"></div></div>';
  return '<div id="reg-form-wrap">'+
    '<div class="fb-h">Create '+rLabel+' Account</div>'+
    '<div class="fb-s">Register a new account. An admin will verify and activate within 24 hours.</div>'+
    '<div class="fb-chip" style="background:'+c.chip.bg+';border:1px solid '+c.chip.bd+';color:'+c.chip.c+'">'+c.chip.tx+'</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
      '<div class="fg"><label class="fb-lbl">First Name</label><div class="fb-wrap"><input class="fb-in" id="reg-fn" placeholder="First name" onfocus="this.style.borderColor=\''+c.ac+'\'" onblur="this.style.borderColor=\'\'"></div></div>'+
      '<div class="fg"><label class="fb-lbl">Last Name</label><div class="fb-wrap"><input class="fb-in" id="reg-ln" placeholder="Last name" onfocus="this.style.borderColor=\''+c.ac+'\'" onblur="this.style.borderColor=\'\'"></div></div>'+
    '</div>'+
    '<div class="fg"><label class="fb-lbl">Email Address</label><div class="fb-wrap"><input class="fb-in" id="reg-em" type="email" placeholder="you@university.edu" onfocus="this.style.borderColor=\''+c.ac+'\'" onblur="this.style.borderColor=\'\'"></div><div class="fb-err" id="reg-err-em">Please enter a valid email</div></div>'+
    extraField+
    '<div class="fg"><label class="fb-lbl">Password</label><div class="fb-wrap"><input class="fb-in" id="reg-pw" type="password" placeholder="Minimum 8 characters" onfocus="this.style.borderColor=\''+c.ac+'\'" onblur="this.style.borderColor=\'\'"><button class="fb-eye" onclick="tvPw(this)">👁</button></div></div>'+
    '<div class="fg"><label class="fb-lbl">Confirm Password</label><div class="fb-wrap"><input class="fb-in" id="reg-pw2" type="password" placeholder="Repeat password" onfocus="this.style.borderColor=\''+c.ac+'\'" onblur="this.style.borderColor=\'\'"></div><div class="fb-err" id="reg-err-pw">Passwords do not match</div></div>'+
    '<div style="background:rgba(255,255,255,.03);border:1px solid var(--brd);border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:11px;color:var(--t3)">ℹ️  Account will be reviewed by an admin and activated within 24 hours.</div>'+
    '<button class="fb-btn" id="reg-btn" style="background:'+c.btnBg+';box-shadow:0 8px 30px '+c.btnSh+'" onclick="doRegister(\''+role+'\',\''+c.ac+'\')">Create Account</button>'+
    '<div class="fb-sw" style="margin-top:14px">Already have an account? <a style="color:'+c.ac2+';font-weight:700" onclick="switchLTab(\'signin\',\''+c.ac+'\')">Sign In</a></div>'+
    '</div>'+
    '<div id="reg-success-wrap" style="display:none;text-align:center;padding:32px 0">'+
      '<div style="font-size:56px;margin-bottom:14px">✅</div>'+
      '<div style="font-size:19px;font-weight:900;letter-spacing:-.03em;color:var(--t1);margin-bottom:8px">Account Request Sent!</div>'+
      '<div style="font-size:13px;color:var(--t3);line-height:1.6;margin-bottom:20px">Your '+rLabel+' account is pending admin approval. Check your email for next steps.</div>'+
      '<button class="fb-btn" style="background:'+c.btnBg+'" onclick="switchLTab(\'signin\',\''+c.ac+'\')">← Back to Sign In</button>'+
    '</div>';
}

function switchLTab(tab, ac){
  var si=document.getElementById('tab-si-ct'),cr=document.getElementById('tab-ca-ct');
  var tsi=document.getElementById('tab-si'),tcr=document.getElementById('tab-ca');
  if(!si||!cr)return;
  if(tab==='signin'){
    si.style.display='block';cr.style.display='none';
    tsi.classList.add('on');tsi.style.background=ac;
    tcr.classList.remove('on');tcr.style.background='';
  } else {
    si.style.display='none';cr.style.display='block';
    tcr.classList.add('on');tcr.style.background=ac;
    tsi.classList.remove('on');tsi.style.background='';
  }
}

function tvPw(b){var i=b.previousElementSibling;i.type=i.type==='password'?'text':'password';b.textContent=i.type==='password'?'👁':'🙈';}

function doLogin(role){
  var c=RC[role];
  var em=document.getElementById('fi-em')&&document.getElementById('fi-em').value.trim();
  var pw=document.getElementById('fi-pw')&&document.getElementById('fi-pw').value.trim();
  var eEm=document.getElementById('e-em'),ePw=document.getElementById('e-pw');
  if(eEm)eEm.classList.remove('on');if(ePw)ePw.classList.remove('on');
  if(!em){if(eEm)eEm.classList.add('on');return;}
  if(!pw){if(ePw){ePw.textContent='Please enter your password';ePw.classList.add('on');}return;}
  if(em!==c.demo.e||pw!==c.demo.p){
    if(ePw){ePw.textContent='Incorrect email or password — use the demo credentials above';ePw.classList.add('on');}
    var b=document.getElementById('lbtn');
    if(b){b.classList.add('do-shake');setTimeout(function(){b.classList.remove('do-shake');},400);}
    ['fi-em','fi-pw'].forEach(function(id){var el=document.getElementById(id);if(el){el.style.borderColor='var(--red)';el.style.boxShadow='0 0 0 3px rgba(245,69,106,.12)';setTimeout(function(){el.style.borderColor='';el.style.boxShadow='';},1800);}});
    return;
  }
  var b=document.getElementById('lbtn'),orig=b?b.innerHTML:'';
  if(b){b.innerHTML='<div class="spin"></div> Signing you in...';b.disabled=true;}
  setTimeout(function(){
    if(b){b.innerHTML='✓ &nbsp;Signed in!';}
    setTimeout(function(){if(b){b.innerHTML=orig;b.disabled=false;}enterDash(role);},900);
  },1600);
}

function doRegister(role, ac){
  var fn=document.getElementById('reg-fn')&&document.getElementById('reg-fn').value.trim();
  var ln=document.getElementById('reg-ln')&&document.getElementById('reg-ln').value.trim();
  var em=document.getElementById('reg-em')&&document.getElementById('reg-em').value.trim();
  var pw=document.getElementById('reg-pw')&&document.getElementById('reg-pw').value.trim();
  var pw2=document.getElementById('reg-pw2')&&document.getElementById('reg-pw2').value.trim();
  var eEm=document.getElementById('reg-err-em'),ePw=document.getElementById('reg-err-pw');
  if(eEm)eEm.classList.remove('on');if(ePw)ePw.classList.remove('on');
  if(!fn||!ln){toast('⚠️ Please enter your full name');return;}
  if(!em||em.indexOf('@')<0){if(eEm)eEm.classList.add('on');return;}
  if(!pw||pw.length<8){if(ePw){ePw.textContent='Password must be at least 8 characters';ePw.classList.add('on');}return;}
  if(pw!==pw2){if(ePw){ePw.textContent='Passwords do not match';ePw.classList.add('on');}return;}
  var btn=document.getElementById('reg-btn');
  if(btn){btn.innerHTML='<div class="spin"></div> Creating account...';btn.disabled=true;}
  setTimeout(function(){
    var fw=document.getElementById('reg-form-wrap'),sw=document.getElementById('reg-success-wrap');
    if(fw)fw.style.display='none';if(sw)sw.style.display='block';
    var sk={student:'students',lecturer:'lecturers',advisor:'advisors',admin:'admins',provost:'provosts'}[role]||'students';
    ACCOUNT_STORE[sk].push({id:role.slice(0,3).toUpperCase()+'-'+Math.floor(Math.random()*900+100),name:fn+' '+ln,email:em,role:role,dept:'Pending',status:'pending',created:new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})});
    toast('✅ Account request submitted for '+fn+' '+ln);
  },1800);
}

/* ═══════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════ */
var currentRole='student',currentView='home';

function enterDash(role){
  var c=RC[role];
  document.getElementById('topAv').textContent=c.ini;document.getElementById('topAv').style.background=c.avBg;
  document.getElementById('umName').textContent=c.name;document.getElementById('umRole').textContent=c.role.split('·')[0].trim();
  document.getElementById('sbAv').textContent=c.ini;document.getElementById('sbName').textContent=c.name;document.getElementById('sbRole').textContent=c.role;
  sideOpen=true;document.getElementById('dside').classList.remove('closed');document.getElementById('hbg').classList.add('x');
  currentRole=role;buildNav(role,'home');renderView(role,'home');
  show('s-dash');toast('✅ Welcome, '+c.name+'!');
}

function signOut(){
  stopQR();currentRole='student';currentView='home';
  show('s-hub');toast('👋 Signed out — see you next time!');
}

function buildNav(role,active){
  var items=NAV[role]||NAV.student;
  document.getElementById('sideNav').innerHTML='<div class="ds-lbl">Navigation</div>'+
    items.map(function(n){return'<div class="nav-item '+(n.id===active?'on':'')+'" onclick="navTo(\''+role+'\',\''+n.id+'\',this)"><span class="ni-ic">'+n.ic+'</span>'+n.lb+(n.bg?'<span class="ni-badge">'+n.bg+'</span>':'')+'</div>';}).join('');
}

function navTo(role,id,el){
  if(role==='student'&&id==='scan'){openScan();return;}
  document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('on');});
  if(el)el.classList.add('on');currentView=id;
  try{var fn=VIEWS[role]&&VIEWS[role][id];document.getElementById('mainArea').innerHTML=fn?fn():'<div class="page-title">Coming soon</div><div class="page-sub">This section is under construction.</div>';}
  catch(e){document.getElementById('mainArea').innerHTML='<div class="page-title">Page Error</div><div class="page-sub">'+e.message+'</div>';}
  setTimeout(function(){document.querySelectorAll('.pf[data-w]').forEach(function(e){e.style.width=e.dataset.w+'%';});},80);
}

function renderView(role,id){
  currentView=id;buildNav(role,id);
  try{var fn=VIEWS[role]&&VIEWS[role][id];document.getElementById('mainArea').innerHTML=fn?fn():'<div class="page-title">Coming soon</div>';}
  catch(e){document.getElementById('mainArea').innerHTML='<div class="page-title">Page Error</div><div class="page-sub">'+e.message+'</div>';}
  setTimeout(function(){document.querySelectorAll('.pf[data-w]').forEach(function(e){e.style.width=e.dataset.w+'%';});},80);
}

/* ═══════════════════════════════════════════
   QR SYSTEM
═══════════════════════════════════════════ */
var qrTimer=null,qrFeedTimer=null,qrSecsLeft=0,qrActive=false,checkins=[];
var DEMO_STUDENTS=['Jordan Smith','Amaka Eze','Femi Adegoke','Priya Sharma','Chidi Nwachukwu','Ngozi Williams','Obi Okafor','Tunde Fashola','Halima Yusuf','Emeka Chukwu','Chinwe Agu','Bayo Mensah'];

function createQR(){
  var course=document.getElementById('qs-course')&&document.getElementById('qs-course').value||'BUS 202';
  var room=document.getElementById('qs-room')&&document.getElementById('qs-room').value||'Room 304';
  var mins=parseInt((document.getElementById('qs-mins')&&document.getElementById('qs-mins').value)||10);
  var empty=document.getElementById('qrEmpty'),stage=document.getElementById('qrStage'),actions=document.getElementById('qrActions');
  if(!stage){toast('⚠️ Please go to Create QR Session page first');return;}
  if(empty)empty.style.display='none';
  stage.style.display='flex';
  if(actions)actions.style.display='flex';
  // Generate QR code using our built-in engine
  var qrEl=document.getElementById('qrCode');
  if(qrEl){
    var payload=JSON.stringify({course:course,room:room,time:new Date().toISOString()});
    drawQR(qrEl,payload,186);
  }
  var nm=document.getElementById('qrName'),mt=document.getElementById('qrMeta'),ti=document.getElementById('qrTimer');
  if(nm)nm.textContent=course;
  if(mt)mt.textContent=room+' · '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+' · Today';
  if(ti){ti.className='qr-countdown';ti.textContent='--:--';}
  checkins=[];updateCount();
  var feed=document.getElementById('qrFeed');
  if(feed)feed.innerHTML='<div style="font-size:12px;color:var(--t4);text-align:center;padding:24px 0">Waiting for students to scan...</div>';
  qrSecsLeft=mins*60;qrActive=true;
  clearInterval(qrTimer);qrTimer=setInterval(tickQR,1000);
  clearInterval(qrFeedTimer);var si=0;
  qrFeedTimer=setInterval(function(){if(!qrActive||si>=DEMO_STUDENTS.length){clearInterval(qrFeedTimer);return;}addScan(DEMO_STUDENTS[si++],Math.random()>.25?'present':'late');},3000);
  toast('✅ QR session active — students can now scan');
}

function tickQR(){
  if(!qrActive)return;
  qrSecsLeft--;
  var el=document.getElementById('qrTimer');if(!el){stopQR();return;}
  if(qrSecsLeft<=0){el.textContent='Expired';el.className='qr-countdown exp';stopQR();toast('⏱ Session expired — '+checkins.length+' students marked');return;}
  var m=Math.floor(qrSecsLeft/60),s=qrSecsLeft%60;
  el.textContent=(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
  el.className='qr-countdown'+(qrSecsLeft<=120?' warn':qrSecsLeft<=30?' exp':'');
}
function stopQR(){qrActive=false;clearInterval(qrTimer);qrTimer=null;clearInterval(qrFeedTimer);qrFeedTimer=null;}
function regenQR(){stopQR();setTimeout(createQR,100);toast('🔄 New QR generated');}
function endSession(){var n=checkins.length;stopQR();toast('⏹ Session ended — '+n+' student'+(n!==1?'s':'')+' marked');var s=document.getElementById('qrStage'),e=document.getElementById('qrEmpty'),a=document.getElementById('qrActions');if(s)s.style.display='none';if(e)e.style.display='flex';if(a)a.style.display='none';}
function addScan(name,status){
  checkins.push({name:name,status:status});updateCount();
  var feed=document.getElementById('qrFeed');if(!feed)return;
  if(feed.children.length===1&&feed.children[0].textContent.indexOf('Waiting')>=0)feed.innerHTML='';
  var now=new Date(),ts=(now.getHours()<10?'0':'')+now.getHours()+':'+(now.getMinutes()<10?'0':'')+now.getMinutes()+':'+(now.getSeconds()<10?'0':'')+now.getSeconds();
  var row=document.createElement('div');row.className='feed-row';
  row.innerHTML='<div class="av" style="width:30px;height:30px;font-size:10px">'+name.split(' ').map(function(x){return x[0];}).join('')+'</div><div style="flex:1"><div style="font-size:13px;font-weight:700;color:var(--t1)">'+name+'</div><div style="font-family:var(--mono);font-size:11px;color:var(--t4)">'+ts+'</div></div><span class="badge '+(status==='present'?'green':'amber')+'">'+( status==='present'?'Present':'Late')+'</span>';
  feed.insertBefore(row,feed.firstChild);if(feed.children.length>8)feed.removeChild(feed.lastChild);
}
function updateCount(){var e=document.getElementById('scanCount');if(e)e.textContent=checkins.length;}

/* ═══ STUDENT SCANNER ═══ */
function openScan(){document.getElementById('scanOv').classList.add('on');}
function closeScan(){document.getElementById('scanOv').classList.remove('on');}
function simulateScan(){
  closeScan();
  var late=Math.random()>.55,r=document.getElementById('succRing');
  r.style.cssText='background:'+(late?'rgba(245,166,35,.15)':'rgba(15,186,129,.15)')+';border:2px solid '+(late?'var(--amber)':'var(--green)');
  r.textContent=late?'⏰':'✓';
  document.getElementById('succTitle').textContent=late?'Attendance Recorded (Late)':'Attendance Recorded';
  document.getElementById('succSub').textContent=late?'Your arrival was after the session started.':'Presence successfully logged.';
  var now=new Date();
  document.getElementById('succBody').innerHTML='<div class="succ-detail"><span class="sd-key">Course</span><span class="sd-val">BUS 202 — Business Ethics</span></div><div class="succ-detail"><span class="sd-key">Date</span><span class="sd-val">'+now.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})+'</span></div><div class="succ-detail"><span class="sd-key">Time</span><span class="sd-val" style="font-family:var(--mono)">'+now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'</span></div><div class="succ-detail"><span class="sd-key">Status</span><span class="badge '+(late?'amber':'green')+'">'+(late?'LATE':'ON TIME')+'</span></div>';
  document.getElementById('succOv').classList.add('on');
}
function closeSucc(){document.getElementById('succOv').classList.remove('on');toast('✅ Attendance logged successfully');}

/* ═══ MODALS + UTILS ═══ */
function openMod(html){document.getElementById('modBody').innerHTML=html;document.getElementById('modOv').classList.add('on');}
function closeMod(e){if(!e||e.target.id==='modOv')document.getElementById('modOv').classList.remove('on');}
function chp(el,p){var par=p||el.closest('.fchips')||el.parentElement;par.querySelectorAll('.chip').forEach(function(c){c.classList.remove('on');});el.classList.add('on');}
function togNtf(el){el.classList.toggle('on');el.classList.toggle('off');}
var _tt;function toast(m){var e=document.getElementById('toast');e.textContent=m;e.classList.add('on');clearTimeout(_tt);_tt=setTimeout(function(){e.classList.remove('on');},3400);}

/* Account management */
var _acctFilter='all';
function renderAcctTable(filter,search){
  _acctFilter=filter||_acctFilter||'all';search=search||'';
  var all=ACCOUNT_STORE.students.concat(ACCOUNT_STORE.lecturers,ACCOUNT_STORE.advisors,ACCOUNT_STORE.admins,ACCOUNT_STORE.provosts);
  var filtered=all.filter(function(a){return(_acctFilter==='all'||a.role===_acctFilter)&&(!search||a.name.toLowerCase().indexOf(search.toLowerCase())>=0||a.email.toLowerCase().indexOf(search.toLowerCase())>=0);});
  var tbody=document.getElementById('acctBody');if(!tbody)return;
  var rc={student:'blue',lecturer:'green',advisor:'amber',admin:'purple',provost:'teal'};
  tbody.innerHTML=filtered.map(function(a){return'<tr><td><div style="display:flex;align-items:center;gap:9px"><div class="av" style="width:30px;height:30px;font-size:10px">'+a.name.split(' ').map(function(x){return x[0];}).join('')+'</div><span style="font-weight:700;color:var(--t1)">'+a.name+'</span></div></td><td style="font-size:12px;color:var(--t3)">'+a.email+'</td><td><span class="badge '+(rc[a.role]||'gray')+'" style="text-transform:capitalize">'+a.role+'</span></td><td style="font-size:12px;color:var(--t3)">'+a.dept+'</td><td><span class="badge '+(a.status==='active'?'green':a.status==='pending'?'amber':'red')+'">'+a.status+'</span></td><td style="font-size:12px;color:var(--t4)">'+a.created+'</td><td><div style="display:flex;gap:5px"><button class="btn ghost sm" onclick="toast(\'✏️ Editing '+a.name+'...\')">Edit</button><button class="btn danger sm" onclick="toast(\'🔒 '+a.name+' suspended\')">Suspend</button></div></td></tr>';}).join('');
  if(!filtered.length)tbody.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--t4);padding:28px">No accounts found</td></tr>';
}
function filterRole(r,el){_acctFilter=r;document.querySelectorAll('#acct-chips .chip').forEach(function(c){c.classList.remove('on');});if(el)el.classList.add('on');renderAcctTable(_acctFilter,'');}
function filterAccounts(s){renderAcctTable(_acctFilter,s);}

function openCreateAccount(){
  openMod('<div class="modal-head"><div class="modal-title">➕ Create New Account</div><div class="modal-x" onclick="closeMod()">✕</div></div>'+
    '<div class="fg"><label class="fl">Role</label><select class="fi" id="ca-role" onchange="updateCAFields()"><option value="">— Select role —</option><option value="student">Student</option><option value="lecturer">Lecturer</option><option value="advisor">Academic Advisor</option><option value="admin">Admin / Dept. Head</option><option value="provost">Provost</option></select></div>'+
    '<div class="frow"><div class="fg"><label class="fl">First Name</label><input class="fi" id="ca-fn" placeholder="First name"></div><div class="fg"><label class="fl">Last Name</label><input class="fi" id="ca-ln" placeholder="Last name"></div></div>'+
    '<div class="fg"><label class="fl">Email Address</label><input class="fi" id="ca-em" type="email" placeholder="user@university.edu"></div>'+
    '<div id="ca-extra-wrap" style="display:none"><div class="fg"><label class="fl" id="ca-extra-lbl">Year / Course</label><input class="fi" id="ca-extra" placeholder=""></div></div>'+
    '<div class="fg"><label class="fl">Department</label><select class="fi" id="ca-dept"><option>Computer Science</option><option>Mathematics</option><option>Biology</option><option>Business</option><option>Chemistry</option><option>English</option><option>Physics</option><option>Student Affairs</option><option>University Administration</option></select></div>'+
    '<div class="fg"><label class="fl">Temporary Password</label><div style="position:relative"><input class="fi" id="ca-pw" type="text" placeholder="Min 8 characters" style="padding-right:110px"><button onclick="genPass()" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:rgba(59,123,248,.12);border:1px solid rgba(59,123,248,.25);color:var(--blue);border-radius:7px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">Generate</button></div></div>'+
    '<div style="background:rgba(59,123,248,.07);border:1px solid rgba(59,123,248,.15);border-radius:10px;padding:11px 14px;margin-bottom:16px;font-size:12px;color:var(--t3)">ℹ️ A welcome email with login credentials will be sent automatically.</div>'+
    '<button class="btn pri ful" onclick="submitCreateAccount()" style="padding:14px;font-size:14px">Create Account &amp; Send Welcome Email</button>');
}
function updateCAFields(){
  var r=document.getElementById('ca-role')&&document.getElementById('ca-role').value;
  var wrap=document.getElementById('ca-extra-wrap'),lbl=document.getElementById('ca-extra-lbl'),inp=document.getElementById('ca-extra');
  if(!wrap)return;
  if(r==='student'){wrap.style.display='block';if(lbl)lbl.textContent='Academic Year';if(inp)inp.placeholder='e.g. Year 1';}
  else if(r==='lecturer'){wrap.style.display='block';if(lbl)lbl.textContent='Course(s)';if(inp)inp.placeholder='e.g. BUS 202, CS 101';}
  else wrap.style.display='none';
}
function genPass(){var ch='ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';var p='';for(var i=0;i<12;i++)p+=ch[Math.floor(Math.random()*ch.length)];var el=document.getElementById('ca-pw');if(el)el.value=p;}
function submitCreateAccount(){
  var r=document.getElementById('ca-role')&&document.getElementById('ca-role').value;
  var fn=document.getElementById('ca-fn')&&document.getElementById('ca-fn').value.trim();
  var ln=document.getElementById('ca-ln')&&document.getElementById('ca-ln').value.trim();
  var em=document.getElementById('ca-em')&&document.getElementById('ca-em').value.trim();
  var pw=document.getElementById('ca-pw')&&document.getElementById('ca-pw').value.trim();
  var dept=document.getElementById('ca-dept')&&document.getElementById('ca-dept').value;
  if(!r||!fn||!ln||!em||!pw){toast('⚠️ Please fill in all required fields');return;}
  if(!em.includes('@')){toast('⚠️ Invalid email address');return;}
  if(pw.length<8){toast('⚠️ Password must be at least 8 characters');return;}
  var sk={student:'students',lecturer:'lecturers',advisor:'advisors',admin:'admins',provost:'provosts'}[r]||'students';
  var newId=r.slice(0,3).toUpperCase()+'-'+Math.floor(Math.random()*900+100);
  ACCOUNT_STORE[sk].push({id:newId,name:fn+' '+ln,email:em,role:r,dept:dept,status:'active',created:new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})});
  closeMod();toast('✅ Account created for '+fn+' '+ln+' — welcome email sent to '+em);
}

function studentProfileModal(name){
  var ini=name.split(' ').map(function(x){return x[0];}).join('');
  openMod('<div class="modal-head"><div class="modal-title">Student Profile</div><div class="modal-x" onclick="closeMod()">✕</div></div>'+
    '<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px"><div class="av" style="width:52px;height:52px;font-size:18px;font-weight:900;background:var(--blue);color:#fff">'+ini+'</div><div><div style="font-size:18px;font-weight:900;color:var(--t1)">'+name+'</div><div style="font-size:12px;color:var(--t3)">Computer Science · Year 2</div><span class="badge red" style="margin-top:6px">High Risk</span></div></div>'+
    '<div class="alcard ra" style="margin-bottom:14px"><div class="al-ico" style="font-size:15px">⚠️</div><div><div class="al-title" style="font-size:13px">Why flagged</div><div class="al-sub">Absent 5 consecutive days. Grades declined in Data Structure (55%) and Calc II (48%).</div></div></div>'+
    '<div style="display:flex;gap:8px;margin-bottom:14px"><div class="sp-stat"><div class="sp-stat-v" style="color:var(--red)">42%</div><div class="sp-stat-l">Attendance</div></div><div class="sp-stat"><div class="sp-stat-v">1.8</div><div class="sp-stat-l">GPA</div></div><div class="sp-stat"><div class="sp-stat-v" style="color:var(--amber)">2</div><div class="sp-stat-l">Interventions</div></div></div>'+
    '<div class="risk-labels"><span>HIGH</span><span>MODERATE</span><span>LOW</span></div><div class="risk-track"><div class="risk-thumb" style="left:15%"></div></div>'+
    '<div style="display:flex;gap:8px;margin-top:16px"><button class="btn pri" style="flex:1" onclick="closeMod();renderView(currentRole,\'intervene\')">Log Intervention</button><button class="btn ghost" style="flex:1" onclick="closeMod();toast(\'📅 Meeting scheduled with '+name+'\')">Schedule Meeting</button></div>');
}
function meetingModal(){
  openMod('<div class="modal-head"><div class="modal-title">Schedule Advisor Meeting</div><div class="modal-x" onclick="closeMod()">✕</div></div>'+
    '<div class="fg"><label class="fl">Advisor</label><input class="fi" value="Advisor Smith" readonly></div>'+
    '<div class="fg"><label class="fl">Date</label><input class="fi" type="date" value="2026-04-22"></div>'+
    '<div class="fg"><label class="fl">Time</label><select class="fi"><option>10:00 AM</option><option>11:00 AM</option><option>2:00 PM</option></select></div>'+
    '<div class="fg"><label class="fl">Reason</label><textarea class="fi" placeholder="Briefly describe your concern..."></textarea></div>'+
    '<button class="btn pri ful" onclick="closeMod();toast(\'📅 Meeting requested — Advisor Smith will confirm within 24h\')">Request Meeting</button>');
}

/* ═══════════════════════════════════════════
   ACCOUNTS VIEW (shared admin + provost)
═══════════════════════════════════════════ */
function accountsView(){
  setTimeout(function(){renderAcctTable('all','');},80);
  return '<div class="page-title">Manage Accounts</div><div class="page-sub">Create and manage all user accounts</div>'+
    '<div style="display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;align-items:center">'+
      '<input class="fi" placeholder="🔍 Search accounts..." style="max-width:260px" oninput="filterAccounts(this.value)">'+
      '<div class="fchips" style="margin:0" id="acct-chips">'+
        '<div class="chip on" onclick="filterRole(\'all\',this)">All</div>'+
        '<div class="chip" onclick="filterRole(\'student\',this)">Students</div>'+
        '<div class="chip" onclick="filterRole(\'lecturer\',this)">Lecturers</div>'+
        '<div class="chip" onclick="filterRole(\'advisor\',this)">Advisors</div>'+
        '<div class="chip" onclick="filterRole(\'admin\',this)">Admins</div>'+
        '<div class="chip" onclick="filterRole(\'provost\',this)">Provosts</div>'+
      '</div>'+
      '<button class="btn teal-b sm" onclick="openCreateAccount()" style="margin-left:auto">➕ Create New Account</button>'+
    '</div>'+
    '<div class="card"><table class="dtab"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody id="acctBody"><tr><td colspan="7" style="text-align:center;color:var(--t4);padding:24px">Loading...</td></tr></tbody></table></div>';
}
