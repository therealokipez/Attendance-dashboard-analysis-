/* ═══════════════════════════════════════════
   QR CODE GENERATOR — pure JS, no CDN
═══════════════════════════════════════════ */
var drawQR=(function(){
  var EXP=new Uint8Array(512),LOG=new Uint8Array(256);
  (function(){var x=1;for(var i=0;i<255;i++){EXP[i]=x;LOG[x]=i;x<<=1;if(x&256)x^=285;}for(var i=255;i<512;i++)EXP[i]=EXP[i-255];})();
  function mul(a,b){return(a&&b)?EXP[(LOG[a]+LOG[b])%255]:0;}
  function genPoly(n){var p=[1];for(var i=0;i<n;i++){var q=new Uint8Array(p.length+1);for(var j=0;j<p.length;j++){q[j+1]^=p[j];q[j]^=mul(p[j],EXP[i]);}p=Array.from(q);}return p;}
  function ecBytes(data,n){var gen=genPoly(n);var res=data.slice();res.length+=n;for(var i=0;i<data.length;i++){var c=res[i];if(c)for(var j=0;j<gen.length;j++)res[i+j]^=mul(gen[j],c);}return res.slice(data.length);}

  function makeMatrix(ver){
    var N=ver*4+17,M=[];
    for(var i=0;i<N;i++){M[i]=new Array(N).fill(-1);}
    // Finder pattern helper
    function finder(r,c){
      for(var dr=-1;dr<=7;dr++)for(var dc=-1;dc<=7;dc++){
        var rr=r+dr,cc=c+dc;if(rr<0||rr>=N||cc<0||cc>=N)continue;
        M[rr][cc]=(dr>=0&&dr<=6&&dc>=0&&dc<=6)&&(dr===0||dr===6||dc===0||dc===6||(dr>=2&&dr<=4&&dc>=2&&dc<=4))?1:0;
      }
    }
    finder(0,0);finder(0,N-7);finder(N-7,0);
    // Timing
    for(var i=8;i<N-8;i++){if(M[6][i]<0)M[6][i]=i%2?0:1;if(M[i][6]<0)M[i][6]=i%2?0:1;}
    // Dark module
    M[4*ver+9][8]=1;
    // Alignment (ver>=2)
    if(ver>=2){var ap=[6,N-7];for(var r=0;r<ap.length;r++)for(var c=0;c<ap.length;c++){if(M[ap[r]][ap[c]]>=0)continue;for(var dr=-2;dr<=2;dr++)for(var dc=-2;dc<=2;dc++)M[ap[r]+dr][ap[c]+dc]=(Math.abs(dr)===2||Math.abs(dc)===2||(!dr&&!dc))?1:0;}}
    return M;
  }

  function applyFormat(M,N,mask,ecl){
    // format bits: ecl=1(M), mask
    var fmt=[0x5412,0x5125,0x5E7C,0x5B4B,0x45F9,0x40CE,0x4F97,0x4AA0][mask]|((ecl===1?1:ecl===0?3:ecl===3?0:2)<<13);
    // simplified: use precomputed for M+mask0 = 0x72F3 XOR 0x5412
    var bits=[];var f=fmt^0x5412;for(var i=14;i>=0;i--)bits.push((f>>i)&1);
    var p1=[[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
    var p2=[[N-1,8],[N-2,8],[N-3,8],[N-4,8],[N-5,8],[N-6,8],[N-7,8],[8,N-8],[8,N-7],[8,N-6],[8,N-5],[8,N-4],[8,N-3],[8,N-2],[8,N-1]];
    for(var i=0;i<15;i++){M[p1[i][0]][p1[i][1]]=bits[i];M[p2[i][0]][p2[i][1]]=bits[i];}
  }

  return function drawQR(container,text,sz){
    sz=sz||200;
    try{
      // Encode text as bytes
      var bytes=[];for(var i=0;i<Math.min(text.length,40);i++)bytes.push(text.charCodeAt(i)&255);
      var ver=1;var dc=19;// version 1, M
      if(bytes.length>19){ver=2;dc=28;}
      if(bytes.length>28){ver=3;dc=44;}
      // Build data bits
      var bits=[];
      function addB(v,n){for(var i=n-1;i>=0;i--)bits.push((v>>i)&1);}
      addB(4,4);addB(Math.min(bytes.length,dc-2),8);
      for(var i=0;i<Math.min(bytes.length,dc-2);i++)addB(bytes[i],8);
      for(var i=0;i<4&&bits.length<dc*8;i++)bits.push(0);
      while(bits.length%8)bits.push(0);
      var pads=[0xEC,0x11],pi=0;
      while(bits.length<dc*8){addB(pads[pi++%2],8);}
      var data=[];for(var i=0;i<bits.length;i+=8){var b=0;for(var j=0;j<8;j++)b=(b<<1)|bits[i+j];data.push(b);}
      // EC
      var ecCount=[7,10,15][ver-1];
      var ec=ecBytes(data,ecCount);
      var full=data.concat(Array.from(ec));
      // Build stream
      var stream=[];for(var i=0;i<full.length;i++)for(var b=7;b>=0;b--)stream.push((full[i]>>b)&1);
      // Fill matrix
      var N=ver*4+17;
      var M=makeMatrix(ver);
      // Mark reserved
      var R=[];for(var i=0;i<N;i++)R[i]=M[i].map(function(v){return v>=0;});
      // Place data
      var si=0,up=true,col=N-1;
      while(col>0){
        if(col===6)col--;
        var rows=[];for(var r=0;r<N;r++)rows.push(r);
        if(up)rows.reverse();
        for(var ri=0;ri<rows.length;ri++){for(var dc2=0;dc2<2;dc2++){var r=rows[ri],c=col-dc2;if(!R[r][c]&&si<stream.length){var mask=(r+c)%2===0;M[r][c]=stream[si++]^(mask?1:0);}}}
        up=!up;col-=2;
      }
      applyFormat(M,N,0,1);// mask 0, ecl M
      // Draw canvas
      var canvas=document.createElement('canvas');
      var quiet=4,cell=Math.floor((sz-quiet*2)/N);
      var csz=N*cell+quiet*2;
      canvas.width=csz;canvas.height=csz;
      var ctx=canvas.getContext('2d');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,csz,csz);
      ctx.fillStyle='#000';
      for(var r=0;r<N;r++)for(var c=0;c<N;c++)
        if(M[r][c]===1)ctx.fillRect(quiet+c*cell,quiet+r*cell,cell,cell);
      container.innerHTML='';
      container.appendChild(canvas);
    }catch(e){
      // Fallback visual
      var canvas=document.createElement('canvas');canvas.width=sz;canvas.height=sz;
      var ctx=canvas.getContext('2d');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,sz,sz);ctx.fillStyle='#000';
      [[0,0],[0,sz-56],[sz-56,0]].forEach(function(p){
        ctx.fillRect(p[1],p[0],56,56);ctx.fillStyle='#fff';ctx.fillRect(p[1]+8,p[0]+8,40,40);
        ctx.fillStyle='#000';ctx.fillRect(p[1]+16,p[0]+16,24,24);
      });
      var s=text.split('').reduce(function(a,c){return a+c.charCodeAt(0);},7);
      for(var r=70;r<sz-10;r+=8)for(var c=10;c<sz-10;c+=8){s=(s*6364136223846793005+1442695040888963407)>>>0;if(s%3)ctx.fillRect(c,r,6,6);}
      container.innerHTML='';container.appendChild(canvas);
    }
  };
})();

/* ═══════════════════════════════════════════
   ROLE CONFIGS
═══════════════════════════════════════════ */
var RC={
  student:{ac:'#3B7BF8',rgb:'59,123,248',visBg:'linear-gradient(140deg,#030810,#060f22 50%,#091840)',
    glows:[{c:'#3B7BF8',o:.18,s:'520px',t:'-160px',l:'-110px'},{c:'#5B4CF5',o:.1,s:'340px',b:'-80px',r:'0'}],
    pat:'background-image:linear-gradient(rgba(59,123,248,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(59,123,248,.045) 1px,transparent 1px);background-size:52px 52px',
    floats:[{t:'15%',r:'9%',l:'Live Session',v:'BUS 202',s:'Room 304 · Scan QR now',vc:'#6BA5FA'},{t:'43%',r:'7%',l:'My Attendance',v:'73%',s:'This semester'},{t:'67%',r:'12%',l:'Next Class',v:'CS 101',s:'In 42 minutes'}],
    ey:'Student Portal · Spring 2026',big:'Your attendance,<br>one <span style="color:#6BA5FA">scan away.</span>',
    para:'Scan your lecturer\'s QR code in seconds to mark attendance. Get smart alerts and track your academic progress.',
    stats:[{v:'88%',l:'Top rate'},{v:'4.2s',l:'Avg scan'},{v:'5',l:'Courses'}],
    fbg:'#040810',chip:{bg:'rgba(59,123,248,.12)',bd:'rgba(59,123,248,.28)',c:'#93C5FD',tx:'🎓  Student Access'},
    btnBg:'linear-gradient(135deg,#3B7BF8,#2860DC)',btnSh:'rgba(59,123,248,.35)',ac2:'#6BA5FA',sso:'University SSO',
    portalLabel:'Student',
    demo:{e:'alex.johnson@uni.edu',p:'student123'},name:'Alex Johnson',ini:'AJ',role:'Student · Year 2',avBg:'#3B7BF8'},
  lecturer:{ac:'#0FBA81',rgb:'15,186,129',visBg:'linear-gradient(140deg,#020c07,#041410 50%,#062110)',
    glows:[{c:'#0FBA81',o:.18,s:'480px',t:'-120px',l:'-90px'},{c:'#059668',o:.1,s:'300px',b:'-60px',r:'15px'}],
    pat:'background-image:repeating-linear-gradient(55deg,rgba(15,186,129,.04) 0,rgba(15,186,129,.04) 1px,transparent 0,transparent 50%);background-size:28px 28px',
    floats:[{t:'14%',r:'10%',l:'QR Session',v:'BUS 202',s:'182/240 scanned',vc:'#2FD9A0'},{t:'43%',r:'7%',l:'At-Risk',v:'14',s:'Need attention'},{t:'67%',r:'12%',l:'Semester Avg',v:'89%',s:'All sections'}],
    ey:'Lecturer Portal · Spring 2026',big:'Create sessions.<br>Students scan, <span style="color:#2FD9A0">done.</span>',
    para:'Generate a QR code per session. Students scan it instantly to mark attendance. Monitor in real time.',
    stats:[{v:'240',l:'Enrolled'},{v:'89%',l:'Avg attend.'},{v:'3',l:'Sections'}],
    fbg:'#030a06',chip:{bg:'rgba(15,186,129,.12)',bd:'rgba(15,186,129,.28)',c:'#6EE7B7',tx:'🧑‍🏫  Lecturer Access'},
    btnBg:'linear-gradient(135deg,#0FBA81,#0A9668)',btnSh:'rgba(15,186,129,.3)',ac2:'#2FD9A0',sso:'Faculty SSO',
    portalLabel:'Lecturer',
    demo:{e:'dr.vance@uni.edu',p:'lecturer123'},name:'Dr. Vance',ini:'DV',role:'Lecturer · BUS 202',avBg:'#0FBA81'},
  advisor:{ac:'#F5A623',rgb:'245,166,35',visBg:'linear-gradient(140deg,#110900,#1c0f00 50%,#221400)',
    glows:[{c:'#F5A623',o:.18,s:'500px',t:'-110px',l:'-100px'},{c:'#D4891A',o:.1,s:'310px',b:'-60px',r:'0'}],
    pat:'background-image:radial-gradient(circle,rgba(245,166,35,.13) 1px,transparent 1px);background-size:32px 32px',
    floats:[{t:'15%',r:'10%',l:'Priority Alert',v:'Marcus C.',s:'Absent 5 days',vc:'#FBD568'},{t:'43%',r:'7%',l:'Advisees',v:'20',s:'8 need attention'},{t:'67%',r:'12%',l:'Success Rate',v:'83%',s:'Interventions'}],
    ey:'Advisor Portal · Spring 2026',big:'Help students<br>before they <span style="color:#FBD568">fall behind.</span>',
    para:'See your advisee caseload, receive alerts, log interventions and track recovery outcomes.',
    stats:[{v:'20',l:'Advisees'},{v:'83%',l:'Recovery'},{v:'2',l:'High risk'}],
    fbg:'#080600',chip:{bg:'rgba(245,166,35,.12)',bd:'rgba(245,166,35,.28)',c:'#FDE68A',tx:'📋  Advisor Access'},
    btnBg:'linear-gradient(135deg,#F5A623,#D4891A)',btnSh:'rgba(245,166,35,.3)',ac2:'#FBD568',sso:'Staff SSO',
    portalLabel:'Advisor',
    demo:{e:'advisor.smith@uni.edu',p:'advisor123'},name:'Advisor Smith',ini:'AS',role:'Academic Advisor',avBg:'#F5A623'},
  hod:{ac:'#DB2777',rgb:'219,39,119',visBg:'linear-gradient(140deg,#110008,#1c0010 50%,#22001a)',
    glows:[{c:'#DB2777',o:.18,s:'500px',t:'-120px',l:'-100px'},{c:'#9D174D',o:.1,s:'310px',b:'-60px',r:'0'}],
    pat:'background-image:linear-gradient(rgba(219,39,119,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(219,39,119,.045) 1px,transparent 1px);background-size:38px 38px',
    floats:[{t:'15%',r:'9%',l:'Department',v:'Comp. Sci.',s:'420 students · 9 courses',vc:'#F472B6'},{t:'43%',r:'7%',l:'Faculty',v:'12',s:'Lecturers active'},{t:'67%',r:'12%',l:'Dept Avg',v:'86%',s:'Attendance'}],
    ey:'HOD Portal · Spring 2026',big:'Run your department<br>with <span style="color:#F472B6">total clarity.</span>',
    para:'Oversee courses, faculty performance and attendance health across your entire department.',
    stats:[{v:'420',l:'Students'},{v:'9',l:'Courses'},{v:'86%',l:'Dept avg'}],
    fbg:'#0c0008',chip:{bg:'rgba(219,39,119,.12)',bd:'rgba(219,39,119,.28)',c:'#F9A8D4',tx:'🏢  HOD Access'},
    btnBg:'linear-gradient(135deg,#DB2777,#9D174D)',btnSh:'rgba(219,39,119,.3)',ac2:'#F472B6',sso:'Faculty SSO',
    portalLabel:'HOD',
    demo:{e:'hod.cs@uni.edu',p:'hod123'},name:'Dr. Ibrahim',ini:'DI',role:'Head of Dept. · Computer Science',avBg:'#DB2777'},
  admin:{ac:'#8B5CF6',rgb:'139,92,246',visBg:'linear-gradient(140deg,#060410,#0d0820 50%,#130c30)',
    glows:[{c:'#8B5CF6',o:.18,s:'520px',t:'-130px',l:'-110px'},{c:'#7C3AED',o:.1,s:'310px',b:'-60px',r:'0'}],
    pat:'background-image:linear-gradient(rgba(139,92,246,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.04) 1px,transparent 1px);background-size:24px 24px',
    floats:[{t:'15%',r:'10%',l:'Dept. Enrollment',v:'1,240',s:'Students this sem',vc:'#C4B5FD'},{t:'43%',r:'7%',l:'At-Risk',v:'156',s:'32 courses'},{t:'67%',r:'12%',l:'Dept Avg',v:'81%',s:'Weekly'}],
    ey:'Admin Portal · Spring 2026',big:'Institution-wide<br>intelligence, <span style="color:#C4B5FD">one view.</span>',
    para:'Full department oversight — attendance trends, faculty performance and retention analytics.',
    stats:[{v:'1,240',l:'Students'},{v:'32',l:'Courses'},{v:'81%',l:'Dept avg'}],
    fbg:'#060410',chip:{bg:'rgba(139,92,246,.12)',bd:'rgba(139,92,246,.28)',c:'#DDD6FE',tx:'🏛  Admin / Dean Access'},
    btnBg:'linear-gradient(135deg,#8B5CF6,#7C3AED)',btnSh:'rgba(139,92,246,.35)',ac2:'#C4B5FD',sso:'Admin SSO',
    portalLabel:'Admin',
    demo:{e:'dean.williams@uni.edu',p:'admin123'},name:'Dean Williams',ini:'DW',role:'Department Head',avBg:'#8B5CF6'},
  provost:{ac:'#14C882',rgb:'20,200,130',visBg:'linear-gradient(140deg,#030f09,#051a10 50%,#082515)',
    glows:[{c:'#14C882',o:.18,s:'500px',t:'-130px',l:'-100px'},{c:'#0DA86E',o:.1,s:'300px',b:'-60px',r:'0'}],
    pat:'background-image:linear-gradient(rgba(20,200,130,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(20,200,130,.04) 1px,transparent 1px);background-size:44px 44px',
    floats:[{t:'14%',r:'9%',l:'University',v:'12,400',s:'Students enrolled',vc:'#2EE89A'},{t:'43%',r:'7%',l:'Institutional Avg',v:'84%',s:'Attendance'},{t:'67%',r:'12%',l:'Active Accounts',v:'3,820',s:'All roles'}],
    ey:'Deputy Provost Portal · Spring 2026',big:'University-wide<br>authority, <span style="color:#2EE89A">one portal.</span>',
    para:'Full institutional oversight — all departments, all accounts, strategic analytics and executive control.',
    stats:[{v:'12,400',l:'Students'},{v:'8',l:'Depts'},{v:'84%',l:'Uni avg'}],
    fbg:'#030f09',chip:{bg:'rgba(20,200,130,.12)',bd:'rgba(20,200,130,.28)',c:'#6EE7C0',tx:'🎖️  Deputy Provost Access'},
    btnBg:'linear-gradient(135deg,#14C882,#0DA86E)',btnSh:'rgba(20,200,130,.3)',ac2:'#2EE89A',sso:'Executive SSO',
    portalLabel:'Deputy Provost',
    demo:{e:'provost@uni.edu',p:'provost123'},name:'Deputy Provost Adeyemi',ini:'PA',role:'Deputy Provost',avBg:'#14C882'},
};

/* NAV CONFIG */
var NAV={
  student:[{id:'home',ic:'🏠',lb:'Home'},{id:'courses',ic:'📚',lb:'My Courses'},{id:'scan',ic:'⬛',lb:'Scan QR Code'},{id:'calendar',ic:'📅',lb:'Calendar'},{id:'alerts',ic:'🔔',lb:'Alerts & Tips',bg:'3'},{id:'profile',ic:'👤',lb:'Profile & Settings'}],
  lecturer:[{id:'home',ic:'🏠',lb:'Dashboard'},{id:'create',ic:'📡',lb:'Create QR Session'},{id:'sessions',ic:'🗂',lb:'My Sessions'},{id:'students',ic:'👥',lb:'Student Roster'},{id:'analytics',ic:'📊',lb:'Analytics'},{id:'override',ic:'✏️',lb:'Manual Override'}],
  advisor:[{id:'home',ic:'🏠',lb:'Dashboard'},{id:'advisees',ic:'👥',lb:'My Advisees',bg:'8'},{id:'alerts',ic:'⚠️',lb:'Priority Alerts',bg:'2'},{id:'intervene',ic:'📝',lb:'Log Intervention'},{id:'analytics',ic:'📊',lb:'Analytics'},{id:'profile',ic:'👤',lb:'My Profile'}],
  hod:[{id:'home',ic:'🏠',lb:'Overview'},{id:'courses',ic:'📚',lb:'Dept Courses'},{id:'faculty',ic:'🧑‍🏫',lb:'Faculty'},{id:'students',ic:'👥',lb:'Students'},{id:'reports',ic:'📊',lb:'Reports'},{id:'settings',ic:'⚙️',lb:'Settings'}],
  admin:[{id:'home',ic:'🏠',lb:'Overview'},{id:'courses',ic:'📚',lb:'All Courses'},{id:'students',ic:'👥',lb:'All Students'},{id:'reports',ic:'📊',lb:'Reports'},{id:'accounts',ic:'👤',lb:'Manage Accounts'},{id:'settings',ic:'⚙️',lb:'Settings'}],
  provost:[{id:'home',ic:'🏠',lb:'Overview'},{id:'departments',ic:'🏫',lb:'Departments'},{id:'faculty',ic:'🧑‍🏫',lb:'Faculty & Staff'},{id:'reports',ic:'📊',lb:'Strategic Reports'},{id:'accounts',ic:'👤',lb:'Manage Accounts',bg:'NEW'},{id:'settings',ic:'⚙️',lb:'Settings'}],
};

/* ACCOUNT STORE */
var ACCOUNT_STORE={
  students:[{id:'STU-001',name:'Alex Johnson',email:'alex.johnson@uni.edu',role:'student',dept:'Computer Science',status:'active',created:'Jan 10, 2026'},{id:'STU-002',name:'Marcus Clive',email:'marcus.clive@uni.edu',role:'student',dept:'Biology',status:'active',created:'Jan 10, 2026'},{id:'STU-003',name:'Amaka Eze',email:'amaka.eze@uni.edu',role:'student',dept:'Business',status:'active',created:'Jan 10, 2026'}],
  lecturers:[{id:'LEC-001',name:'Dr. Vance',email:'dr.vance@uni.edu',role:'lecturer',dept:'Business',status:'active',created:'Aug 1, 2025'},{id:'LEC-002',name:'Prof. Adeyemi',email:'prof.adeyemi@uni.edu',role:'lecturer',dept:'Computer Science',status:'active',created:'Aug 1, 2025'}],
  advisors:[{id:'ADV-001',name:'Advisor Smith',email:'advisor.smith@uni.edu',role:'advisor',dept:'Student Affairs',status:'active',created:'Aug 1, 2025'}],
  hods:[{id:'HOD-001',name:'Dr. Ibrahim',email:'hod.cs@uni.edu',role:'hod',dept:'Computer Science',status:'active',created:'Aug 1, 2025'}],
  admins:[{id:'ADM-001',name:'Dean Williams',email:'dean.williams@uni.edu',role:'admin',dept:'Computer Science',status:'active',created:'Jan 1, 2025'}],
  provosts:[{id:'PRV-001',name:'Deputy Provost Adeyemi',email:'provost@uni.edu',role:'provost',dept:'University Administration',status:'active',created:'Jan 1, 2025'}],
};

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
  var titles={student:'Welcome back',lecturer:'Good to see you',advisor:'Welcome, Advisor',hod:'Welcome, HOD',admin:'Admin Access',provost:'Welcome, Deputy Provost'};
  var subs={student:'Sign in to your student account',lecturer:'Sign in to your faculty account',advisor:'Sign in to your advising portal',hod:'Sign in to your department portal',admin:'Sign in to the administration portal',provost:'Sign in to your executive Deputy Provost portal'};
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
    '<button class="fb-btn" id="lbtn" style="background:'+c.btnBg+';box-shadow:0 8px 30px '+c.btnSh+'" onclick="doLogin(\''+role+'\')">Sign in to '+c.portalLabel+' Portal</button>'+
    '<div class="fb-or"><span>or</span></div>'+
    '<button class="fb-sso" onclick="toast(\'🏫 Redirecting to '+c.sso+'...\')">🏫 &nbsp;Continue with '+c.sso+'</button>'+
    '<div class="fb-sw" style="margin-top:14px">← <a style="color:'+c.ac2+';font-weight:700" onclick="show(\'s-hub\')">Choose another role</a></div>';
}

function buildCreateForm(role, c){
  var rLabel=c.portalLabel;
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
    var sk={student:'students',lecturer:'lecturers',advisor:'advisors',hod:'hods',admin:'admins',provost:'provosts'}[role]||'students';
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
   ABSENCE STREAK TRACKING → AUTO ADVISOR ALERTS
═══════════════════════════════════════════ */
var ABSENCE_STREAK={};      // studentName -> consecutive missed count
var AUTO_ADVISOR_ALERTS=[]; // {name, count, ts}

function recordSessionOutcome(presentNames, allRosterNames, courseLabel){
  allRosterNames.forEach(function(name){
    if(presentNames.indexOf(name)>=0){
      ABSENCE_STREAK[name]=0;
    }else{
      ABSENCE_STREAK[name]=(ABSENCE_STREAK[name]||0)+1;
      if(ABSENCE_STREAK[name]===3){
        AUTO_ADVISOR_ALERTS.unshift({name:name,count:3,course:courseLabel,ts:new Date()});
        toast('🔔 Auto-alert: '+name+' missed 3 consecutive classes — Advisor Smith notified');
      }
    }
  });
}

/* ═══════════════════════════════════════════
   QR SYSTEM
═══════════════════════════════════════════ */
var qrTimer=null,qrFeedTimer=null,qrSecsLeft=0,qrActive=false,checkins=[];
var DEMO_STUDENTS=['Jordan Smith','Amaka Eze','Femi Adegoke','Priya Sharma','Chidi Nwachukwu','Ngozi Williams','Obi Okafor','Tunde Fashola','Halima Yusuf','Emeka Chukwu','Chinwe Agu','Bayo Mensah'];
var CURRENT_SESSION_COURSE='BUS 202', CURRENT_SESSION_ROOM='Room 304';
var sessionUsedDevices={}; // deviceId -> studentName, reset per session
// A stable "this device" fingerprint for the current browser/session — used to block
// a second student from checking in on a device that already marked attendance.
var THIS_DEVICE_ID='dev-'+Math.random().toString(36).slice(2,10)+'-'+Date.now().toString(36);

function createQR(){
  var course=document.getElementById('qs-course')&&document.getElementById('qs-course').value||'BUS 202';
  var room=document.getElementById('qs-room')&&document.getElementById('qs-room').value||'Room 304';
  var mins=parseInt((document.getElementById('qs-mins')&&document.getElementById('qs-mins').value)||10);
  CURRENT_SESSION_COURSE=course;CURRENT_SESSION_ROOM=room;
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
  if(mt)mt.textContent='📍 '+room+' · '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+' · Today';
  if(ti){ti.className='qr-countdown';ti.textContent='--:--';}
  checkins=[];sessionUsedDevices={};updateCount();
  var feed=document.getElementById('qrFeed');
  if(feed)feed.innerHTML='<div style="font-size:12px;color:var(--t4);text-align:center;padding:24px 0">Waiting for students to scan...</div>';
  qrSecsLeft=mins*60;qrActive=true;
  clearInterval(qrTimer);qrTimer=setInterval(tickQR,1000);
  clearInterval(qrFeedTimer);var si=0;
  qrFeedTimer=setInterval(function(){if(!qrActive||si>=DEMO_STUDENTS.length){clearInterval(qrFeedTimer);return;}addScan(DEMO_STUDENTS[si++],Math.random()>.25?'present':'late','dev-'+Math.random().toString(36).slice(2,9));},3000);
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

function shareQRWhatsApp(){
  var qrEl=document.getElementById('qrCode');
  var canvas=qrEl&&qrEl.querySelector('canvas');
  if(!canvas){toast('⚠️ Generate a QR code first');return;}
  var caption='📡 '+CURRENT_SESSION_COURSE+' attendance QR — '+CURRENT_SESSION_ROOM+'. Scan within the class to check in.';
  canvas.toBlob(function(blob){
    if(!blob){toast('⚠️ Could not export QR image');return;}
    var file=new File([blob],CURRENT_SESSION_COURSE.replace(/\s+/g,'_')+'_qr.png',{type:'image/png'});
    // Preferred: native share sheet with the image file — on mobile this lists WhatsApp directly
    if(navigator.canShare && navigator.canShare({files:[file]})){
      navigator.share({files:[file],title:CURRENT_SESSION_COURSE+' Attendance QR',text:caption})
        .then(function(){toast('✅ Opened share sheet — pick WhatsApp to send');})
        .catch(function(){/* user cancelled */});
      return;
    }
    // Fallback: download the QR image, then open WhatsApp with the caption pre-filled
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();document.body.removeChild(a);
    setTimeout(function(){URL.revokeObjectURL(url);},4000);
    window.open('https://wa.me/?text='+encodeURIComponent(caption),'_blank');
    toast('⬇️ QR image saved — attach it in the WhatsApp chat that just opened');
  },'image/png');
}
function endSession(){
  var n=checkins.length;stopQR();
  var presentNames=checkins.map(function(c){return c.name;});
  var roster=DEMO_STUDENTS.concat(['Alex Johnson']);
  recordSessionOutcome(presentNames,roster,CURRENT_SESSION_COURSE);
  toast('⏹ Session ended — '+n+' student'+(n!==1?'s':'')+' marked');
  var s=document.getElementById('qrStage'),e=document.getElementById('qrEmpty'),a=document.getElementById('qrActions');if(s)s.style.display='none';if(e)e.style.display='flex';if(a)a.style.display='none';
}
function addScan(name,status,deviceId){
  checkins.push({name:name,status:status,device:deviceId});updateCount();
  var feed=document.getElementById('qrFeed');if(!feed)return;
  if(feed.children.length===1&&feed.children[0].textContent.indexOf('Waiting')>=0)feed.innerHTML='';
  var now=new Date(),ts=(now.getHours()<10?'0':'')+now.getHours()+':'+(now.getMinutes()<10?'0':'')+now.getMinutes()+':'+(now.getSeconds()<10?'0':'')+now.getSeconds();
  var row=document.createElement('div');row.className='feed-row';
  row.innerHTML='<div class="av" style="width:30px;height:30px;font-size:10px">'+name.split(' ').map(function(x){return x[0];}).join('')+'</div><div style="flex:1"><div style="font-size:13px;font-weight:700;color:var(--t1)">'+name+'</div><div style="font-family:var(--mono);font-size:11px;color:var(--t4)">'+ts+' · 📍 '+CURRENT_SESSION_ROOM+'</div></div><span class="badge '+(status==='present'?'green':'amber')+'">'+( status==='present'?'Present':'Late')+'</span>';
  feed.insertBefore(row,feed.firstChild);if(feed.children.length>8)feed.removeChild(feed.lastChild);
}
function updateCount(){var e=document.getElementById('scanCount');if(e)e.textContent=checkins.length;}

/* ═══ STUDENT SCANNER (QR → Face ID → GPS → Success) ═══ */
function openScan(){
  document.getElementById('scanOv').classList.add('on');
  document.getElementById('scanStepQR').style.display='block';
  document.getElementById('scanStepFace').style.display='none';
  document.getElementById('scanStepGPS').style.display='none';
}
function closeScan(){document.getElementById('scanOv').classList.remove('on');}

function startVerification(){
  // Same-device check — block a 2nd student checking in on a device already used this session
  var already=sessionUsedDevices[THIS_DEVICE_ID];
  if(already && already!=='Alex Johnson'){
    toast('🚫 This device already marked attendance for '+already+' this session');
    closeScan();
    return;
  }
  document.getElementById('scanStepQR').style.display='none';
  document.getElementById('scanStepFace').style.display='block';
  runFaceID();
}

function runFaceID(){
  var ring=document.getElementById('faceRing'),spin=document.getElementById('faceSpin'),icon=document.getElementById('faceIcon');
  var title=document.getElementById('faceTitle'),sub=document.getElementById('faceSub');
  ring.className='verify-ring';icon.textContent='🙂';title.textContent='Verifying Face ID…';sub.textContent='Hold still — confirming it\'s really you before we log attendance.';
  if(spin)spin.style.display='block';
  setTimeout(function(){
    ring.className='verify-ring ok';if(spin)spin.style.display='none';icon.textContent='✅';
    title.textContent='Face ID Confirmed';sub.textContent='Identity verified successfully.';
    setTimeout(function(){
      document.getElementById('scanStepFace').style.display='none';
      document.getElementById('scanStepGPS').style.display='block';
      runGPSCheck();
    },700);
  },1600);
}

function runGPSCheck(){
  var ring=document.getElementById('gpsRing'),spin=document.getElementById('gpsSpin'),icon=document.getElementById('gpsIcon');
  var title=document.getElementById('gpsTitle'),sub=document.getElementById('gpsSub'),addr=document.getElementById('gpsAddr');
  ring.className='verify-ring';icon.textContent='📍';title.textContent='Checking GPS Location…';sub.textContent='Confirming you\'re inside the classroom radius.';
  if(spin)spin.style.display='block';
  if(addr)addr.textContent='Locating…';
  setTimeout(function(){
    var lat=(6.5244+(Math.random()*0.0006-0.0003)).toFixed(6);
    var lng=(3.3792+(Math.random()*0.0006-0.0003)).toFixed(6);
    if(addr)addr.textContent=CURRENT_SESSION_ROOM+', Faculty Building · '+lat+', '+lng;
    setTimeout(function(){
      ring.className='verify-ring ok';if(spin)spin.style.display='none';icon.textContent='✅';
      title.textContent='Location Verified';sub.textContent='You\'re within range of '+CURRENT_SESSION_ROOM+'.';
      sessionUsedDevices[THIS_DEVICE_ID]='Alex Johnson';
      setTimeout(function(){document.getElementById('scanStepGPS').style.display='none';simulateScan();},700);
    },1300);
  },500);
}

function simulateScan(){
  closeScan();
  var late=Math.random()>.55,r=document.getElementById('succRing');
  r.style.cssText='background:'+(late?'rgba(245,166,35,.15)':'rgba(15,186,129,.15)')+';border:2px solid '+(late?'var(--amber)':'var(--green)');
  r.textContent=late?'⏰':'✓';
  document.getElementById('succTitle').textContent=late?'Attendance Recorded (Late)':'Attendance Recorded';
  document.getElementById('succSub').textContent=late?'Your arrival was after the session started.':'Presence successfully logged.';
  var now=new Date();
  document.getElementById('succBody').innerHTML='<div class="succ-detail"><span class="sd-key">Course</span><span class="sd-val">BUS 202 — Business Ethics</span></div><div class="succ-detail"><span class="sd-key">Date</span><span class="sd-val">'+now.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})+'</span></div><div class="succ-detail"><span class="sd-key">Time</span><span class="sd-val" style="font-family:var(--mono)">'+now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'</span></div><div class="succ-detail"><span class="sd-key">Location</span><span class="sd-val">📍 '+CURRENT_SESSION_ROOM+'</span></div><div class="succ-detail"><span class="sd-key">Verification</span><span class="sd-val">Face ID + GPS ✅</span></div><div class="succ-detail"><span class="sd-key">Status</span><span class="badge '+(late?'amber':'green')+'">'+(late?'LATE':'ON TIME')+'</span></div>';
  document.getElementById('succOv').classList.add('on');
  checkins.push({name:'Alex Johnson',status:late?'late':'present',device:THIS_DEVICE_ID});
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
  var all=ACCOUNT_STORE.students.concat(ACCOUNT_STORE.lecturers,ACCOUNT_STORE.advisors,ACCOUNT_STORE.hods,ACCOUNT_STORE.admins,ACCOUNT_STORE.provosts);
  var filtered=all.filter(function(a){return(_acctFilter==='all'||a.role===_acctFilter)&&(!search||a.name.toLowerCase().indexOf(search.toLowerCase())>=0||a.email.toLowerCase().indexOf(search.toLowerCase())>=0);});
  var tbody=document.getElementById('acctBody');if(!tbody)return;
  var rc={student:'blue',lecturer:'green',advisor:'amber',hod:'pink',admin:'purple',provost:'teal'};
  tbody.innerHTML=filtered.map(function(a){return'<tr><td><div style="display:flex;align-items:center;gap:9px"><div class="av" style="width:30px;height:30px;font-size:10px">'+a.name.split(' ').map(function(x){return x[0];}).join('')+'</div><span style="font-weight:700;color:var(--t1)">'+a.name+'</span></div></td><td style="font-size:12px;color:var(--t3)">'+a.email+'</td><td><span class="badge '+(rc[a.role]||'gray')+'" style="text-transform:capitalize">'+a.role+'</span></td><td style="font-size:12px;color:var(--t3)">'+a.dept+'</td><td><span class="badge '+(a.status==='active'?'green':a.status==='pending'?'amber':'red')+'">'+a.status+'</span></td><td style="font-size:12px;color:var(--t4)">'+a.created+'</td><td><div style="display:flex;gap:5px"><button class="btn ghost sm" onclick="toast(\'✏️ Editing '+a.name+'...\')">Edit</button><button class="btn danger sm" onclick="toast(\'🔒 '+a.name+' suspended\')">Suspend</button></div></td></tr>';}).join('');
  if(!filtered.length)tbody.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--t4);padding:28px">No accounts found</td></tr>';
}
function filterRole(r,el){_acctFilter=r;document.querySelectorAll('#acct-chips .chip').forEach(function(c){c.classList.remove('on');});if(el)el.classList.add('on');renderAcctTable(_acctFilter,'');}
function filterAccounts(s){renderAcctTable(_acctFilter,s);}

function openCreateAccount(){
  openMod('<div class="modal-head"><div class="modal-title">➕ Create New Account</div><div class="modal-x" onclick="closeMod()">✕</div></div>'+
    '<div class="fg"><label class="fl">Role</label><select class="fi" id="ca-role" onchange="updateCAFields()"><option value="">— Select role —</option><option value="student">Student</option><option value="lecturer">Lecturer</option><option value="advisor">Academic Advisor</option><option value="hod">Head of Department</option><option value="admin">Admin / Dept. Head</option><option value="provost">Deputy Provost</option></select></div>'+
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
  var sk={student:'students',lecturer:'lecturers',advisor:'advisors',hod:'hods',admin:'admins',provost:'provosts'}[r]||'students';
  var newId=r.slice(0,3).toUpperCase()+'-'+Math.floor(Math.random()*900+100);
  ACCOUNT_STORE[sk].push({id:newId,name:fn+' '+ln,email:em,role:r,dept:dept,status:'active',created:new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})});
  closeMod();toast('✅ Account created for '+fn+' '+ln+' — welcome email sent to '+em);
}

function studentProfileModal(name){
  var ini=name.split(' ').map(function(x){return x[0];}).join('');
  openMod('<div class="modal-head"><div class="modal-title">Student Profile</div><div class="modal-x" onclick="closeMod()">✕</div></div>'+
    '<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px"><div class="av" style="width:52px;height:52px;font-size:18px;font-weight:900;background:var(--blue);color:#fff">'+ini+'</div><div><div style="font-size:18px;font-weight:900;color:var(--t1)">'+name+'</div><div style="font-size:12px;color:var(--t3)">Computer Science · Year 2</div><span class="badge red" style="margin-top:6px">High Risk</span></div></div>'+
    '<div class="alcard ra" style="margin-bottom:14px"><div class="al-ico" style="font-size:15px">⚠️</div><div><div class="al-title" style="font-size:13px">Why flagged</div><div class="al-sub">Absent 5 consecutive days. Grades declined in Data Structure (55%) and Calc II (48%). Auto-alert sent to advisor after 3rd consecutive miss.</div></div></div>'+
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
        '<div class="chip" onclick="filterRole(\'hod\',this)">HODs</div>'+
        '<div class="chip" onclick="filterRole(\'admin\',this)">Admins</div>'+
        '<div class="chip" onclick="filterRole(\'provost\',this)">Deputy Provosts</div>'+
      '</div>'+
      '<button class="btn teal-b sm" onclick="openCreateAccount()" style="margin-left:auto">➕ Create New Account</button>'+
    '</div>'+
    '<div class="card"><table class="dtab"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody id="acctBody"><tr><td colspan="7" style="text-align:center;color:var(--t4);padding:24px">Loading...</td></tr></tbody></table></div>';
}

/* ═══════════════════════════════════════════
   VIEWS
═══════════════════════════════════════════ */
var VIEWS={
student:{
  home:function(){return'<div class="page-title">Good morning, Alex 👋</div><div class="page-sub">Monday, Apr 20, 2026</div>'+
    '<div class="alcard ra"><div class="al-ico">⚠️</div><div style="flex:1"><div class="al-title">At Risk — Attendance dropped in 2 courses</div><div class="al-sub">Overall 73%, below the 80% threshold. Biology 101 absence limit reached.</div></div><button class="btn warn sm" onclick="navTo(\'student\',\'alerts\',null)">View →</button></div>'+
    '<div class="mrow"><div class="mc red"><div class="mc-ic">📅</div><div class="mc-v">73%</div><div class="mc-l">Attendance</div><div class="mc-t dn">↓ Class avg 85%</div></div><div class="mc blue"><div class="mc-ic">🎓</div><div class="mc-v">2.6</div><div class="mc-l">Current GPA</div><div class="mc-t nt">→ Stable</div></div><div class="mc green"><div class="mc-ic">✅</div><div class="mc-v">14</div><div class="mc-l">Attended</div><div class="mc-t up">↑ This month</div></div><div class="mc amber"><div class="mc-ic">📚</div><div class="mc-v">5</div><div class="mc-l">Courses</div><div class="mc-t nt">→ Sem 2</div></div></div>'+
    '<div class="g60"><div class="card"><div class="sec-head"><div class="sec-title">Attendance by Course</div><span class="badge amber">2 Below</span></div>'+
    [['CS 101: Intro to Algorithms',88,'green'],['MATH 301: Calculus',62,'red'],['BIO 101: Biology',55,'red'],['HIS 201: World History',79,'amber'],['ENG 102: Technical Writing',93,'green']].map(function(c){return'<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span style="color:var(--t2)">'+c[0]+'</span><span style="font-weight:800;color:'+(c[2]==='green'?'var(--green)':c[2]==='red'?'var(--red)':'var(--amber)')+'">'+c[1]+'%</span></div><div class="prog"><div class="pf '+c[2]+'" data-w="'+c[1]+'"></div></div></div>';}).join('')+
    '</div><div style="display:flex;flex-direction:column;gap:14px"><div class="card"><div class="sec-head"><div class="sec-title">Live Now</div><div class="livepill"><div class="ldot"></div>BUS 202</div></div><div style="font-size:14px;font-weight:800;margin-bottom:3px;color:var(--t1)">Business Ethics</div><div style="font-size:12px;color:var(--t3);margin-bottom:10px">📍 Room 304 · 10:00–11:30 AM</div><div style="font-size:12px;color:var(--green);font-weight:700;margin-bottom:12px">✅ Location verified</div><button class="btn pri ful" onclick="openScan()">⬛ Scan Lecturer\'s QR Code</button></div>'+
    '<div class="tip-card"><div class="tc-inner"><div class="tc-label">Tip of the Day</div><div class="tc-text">Schedule a meeting with your Advisor</div></div><button class="btn ghost sm" onclick="meetingModal()">Book →</button></div></div></div>';},
  courses:function(){return'<div class="page-title">My Courses</div><div class="page-sub">Spring 2026 · 5 enrolled</div><div class="g2">'+
    [['CS 101','Intro to Algorithms','Prof. Adeyemi','Mon/Wed 2PM',88,'B+',true],['MATH 301','Calculus II','Dr. Thompson','Tue/Thu 10AM',62,'C+',false],['BIO 101','Biology','Prof. Okonkwo','Mon/Fri 11AM',55,'C',false],['HIS 201','World History','Dr. Smith','Wed 3PM',79,'B',false],['ENG 102','Technical Writing','Prof. Levi','Thu 1PM',93,'A-',false]]
    .map(function(c){return'<div class="card click"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px"><div><div style="font-size:10px;font-weight:800;color:var(--blue);text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px">'+c[0]+'</div><div style="font-size:15px;font-weight:800;color:var(--t1)">'+c[1]+'</div><div style="font-size:12px;color:var(--t3);margin-top:2px">'+c[2]+' · '+c[3]+'</div></div>'+(c[6]?'<div class="livepill"><div class="ldot"></div>LIVE</div>':'<span class="badge gray">'+c[5]+'</span>')+'</div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px"><span style="color:var(--t3)">Attendance</span><span style="font-weight:800;color:'+(c[4]>=80?'var(--green)':c[4]>=65?'var(--amber)':'var(--red)')+'">'+c[4]+'%</span></div><div class="prog"><div class="pf '+(c[4]>=80?'green':c[4]>=65?'amber':'red')+'" data-w="'+c[4]+'"></div></div>'+(c[6]?'<button class="btn pri ful" style="margin-top:10px" onclick="openScan()">⬛ Scan QR to Mark Attendance</button>':'')+'</div>';}).join('')+'</div>';},
  calendar:function(){return'<div class="page-title">Calendar</div><div class="page-sub">April 2026</div><div class="g60"><div class="card"><div class="sec-head"><div class="sec-title">Today · Apr 20</div><span class="badge blue">4 Sessions</span></div>'+
    [['09:00','Intro to Psychology','Room 304','missed'],['10:00','Business Ethics','Room 304','live'],['11:00','Computer Science 101','Lab 4','upcoming'],['14:00','Calculus II','Lecture Hall B','upcoming']]
    .map(function(s){return'<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--brd);align-items:center"><div style="width:50px;font-size:11px;font-weight:700;color:var(--t4);flex-shrink:0;font-family:var(--mono)">'+s[0]+'</div><div style="flex:1"><div style="font-size:13px;font-weight:700;color:var(--t1)">'+s[1]+'</div><div style="font-size:11px;color:var(--t3)">📍 '+s[2]+'</div></div>'+(s[3]==='live'?'<div class="livepill"><div class="ldot"></div>LIVE</div><button class="btn pri sm" onclick="openScan()">Scan</button>':'<span class="badge '+(s[3]==='missed'?'red':'gray')+'">'+(s[3]==='missed'?'Missed':'Upcoming')+'</span>')+'</div>';}).join('')+
    '</div><div class="card"><div class="sec-head"><div class="sec-title">Heatmap · April</div></div><div class="hmap">'+
    [0,1,2,3,2,1,0,3,2,3,1,2,3,0,2,3,1,2,3,2,'a','l',3,'a',2,2,3,1].map(function(v,i){var bg=v==='a'?'rgba(245,69,106,.45)':v==='l'?'rgba(245,166,35,.5)':v===3?'var(--green)':v===2?'rgba(15,186,129,.4)':v===1?'rgba(15,186,129,.18)':'rgba(255,255,255,.04)';return'<div class="hm-cell" style="background:'+bg+'" title="Apr '+(i+1)+'"></div>';}).join('')+
    '</div><div style="display:flex;gap:10px;margin-top:8px;font-size:10px;color:var(--t4)"><span>🟢 Present</span><span>🟡 Late</span><span>🔴 Absent</span></div></div></div>';},
  alerts:function(){return'<div class="page-title">Alerts & Recommendations</div><div class="page-sub">3 active alerts</div><div class="alcard ra"><div class="al-ico">🚨</div><div style="flex:1"><div class="al-title">BIO 101 — Max absence limit reached</div><div class="al-sub">All 4 allowed absences used. Further absences will penalise your grade.</div><div style="display:flex;gap:8px;margin-top:10px"><button class="btn ghost sm" onclick="toast(\'📧 Email sent to professor\')">Email Prof</button><button class="btn pri sm" onclick="meetingModal()">Schedule Meeting</button></div></div></div>'+
    '<div class="alcard aa"><div class="al-ico">⚠️</div><div><div class="al-title">MATH 301 — Missed 3 consecutive lectures</div><div class="al-sub">Attendance at 62%. An automatic alert has been sent to your Advisor. Attend next 3 lectures to recover.</div></div></div>'+
    '<div class="sec-head" style="margin-top:16px"><div class="sec-title">Next Steps</div></div><div class="card">'+
    [['📚','Attend next 3 lectures','Mon, Wed, Fri 10AM','Remind'],['👤','Book office hours — Prof. Smith','Openings today','Book'],['📖','Schedule tutoring','Calculus basics review','Find']]
    .map(function(a){return'<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--brd)"><div style="width:34px;height:34px;border-radius:9px;background:var(--su2);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0">'+a[0]+'</div><div style="flex:1"><div style="font-size:13px;font-weight:700;color:var(--t1)">'+a[1]+'</div><div style="font-size:12px;color:var(--t3)">'+a[2]+'</div></div><button class="btn pri sm" onclick="toast(\'✅ '+a[1]+'\')">'+a[3]+'</button></div>';}).join('')+'</div>';},
  profile:function(){return'<div class="page-title">Profile & Settings</div><div class="page-sub">Manage your account</div><div class="g60"><div class="card"><div style="display:flex;align-items:center;gap:16px;margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid var(--brd)"><div class="profile-av" style="background:var(--blue);color:#fff">AJ</div><div><div style="font-size:20px;font-weight:900;letter-spacing:-.04em;color:var(--t1)">Alex Johnson</div><div style="font-size:12px;color:var(--t3);margin-top:2px">Computer Science · Year 2 · ID: 998210</div><span class="badge red" style="margin-top:6px">At Risk</span></div></div><div class="frow"><div class="fg"><label class="fl">Email</label><input class="fi" value="alex.johnson@uni.edu" readonly></div><div class="fg"><label class="fl">Programme</label><input class="fi" value="B.Sc. Computer Science" readonly></div><div class="fg"><label class="fl">Year</label><input class="fi" value="Year 2" readonly></div><div class="fg"><label class="fl">Advisor</label><input class="fi" value="Advisor Smith" readonly></div></div></div><div style="display:flex;flex-direction:column;gap:14px"><div class="card"><div class="sec-title" style="margin-bottom:12px">Notifications</div>'+
    ['Email alerts','SMS notifications','Weekly digest'].map(function(n){return'<div class="setting-row"><div class="sr-label">'+n+'</div><div class="ntoggle on" onclick="togNtf(this)"></div></div>';}).join('')+'</div><button class="btn ghost ful" onclick="signOut()" style="color:var(--red);border-color:rgba(245,69,106,.25)">🚪 Sign Out</button></div></div>';}
},
lecturer:{
  home:function(){return'<div class="page-title">Good morning, Dr. Vance 🧑‍🏫</div><div class="page-sub">Ready to engage your students today?</div>'+
    '<div class="alcard ga" style="cursor:pointer" onclick="navTo(\'lecturer\',\'create\',null)"><div class="al-ico">📡</div><div style="flex:1"><div class="al-title">Create Today\'s Attendance Session</div><div class="al-sub">Generate a QR code — students scan it with their phones to mark attendance.</div></div><button class="btn grn sm">Create QR →</button></div>'+
    '<div class="mrow"><div class="mc blue"><div class="mc-ic">📡</div><div class="mc-v">76%</div><div class="mc-l">Last Check-in</div><div class="mc-t nt">182/240 scanned</div></div><div class="mc red"><div class="mc-ic">⚠️</div><div class="mc-v">14</div><div class="mc-l">At-Risk</div><div class="mc-t dn">↑ Need attention</div></div><div class="mc green"><div class="mc-ic">📊</div><div class="mc-v">89%</div><div class="mc-l">Semester Avg</div><div class="mc-t up">↑ +2% this month</div></div><div class="mc amber"><div class="mc-ic">🎓</div><div class="mc-v">240</div><div class="mc-l">Enrolled</div><div class="mc-t nt">→ 3 sections</div></div></div>'+
    '<div class="g60"><div class="card"><div class="sec-head"><div class="sec-title">At-Risk Students</div><span class="badge red">14 flagged</span></div><table class="dtab"><thead><tr><th>Student</th><th>Attendance</th><th>Trend</th><th>Action</th></tr></thead><tbody>'+
    [['Marcus Clive',42,'↓ Declining','red'],['Samantha Okonkwo',38,'↓ Critical','red']].map(function(s){return'<tr><td style="font-weight:700;color:var(--t1)">'+s[0]+'</td><td>'+s[1]+'%</td><td><span class="badge '+s[3]+'">'+s[2]+'</span></td><td><button class="btn ghost sm" onclick="studentProfileModal(\''+s[0]+'\')">View</button></td></tr>';}).join('')+
    '</tbody></table></div><div class="card"><div class="sec-head"><div class="sec-title">Today\'s Sessions</div></div>'+
    [['BUS 202','10:00 AM','Room 304','live'],['BUS 210','2:00 PM','Room 112','upcoming']].map(function(s){return'<div class="session-item '+(s[3]==='live'?'active':'')+'"><div style="flex:1"><div style="font-size:13px;font-weight:800;color:var(--t1)">'+s[0]+'</div><div style="font-size:11px;color:var(--t3)">'+s[1]+' · 📍 '+s[2]+'</div></div>'+(s[3]==='live'?'<div class="livepill"><div class="ldot"></div>LIVE</div>':'<span class="badge gray">Upcoming</span>')+'</div>';}).join('')+'</div></div>';},
  create:function(){setTimeout(function(){var el=document.getElementById('qs-course');},50);return'<div class="page-title">Create QR Session</div><div class="page-sub">Generate a live QR code for students to scan</div>'+
    '<div class="qr-setup-grid"><div class="card"><div class="sec-title" style="margin-bottom:14px">Session Details</div>'+
    '<div class="fg"><label class="fl">Course</label><select class="fi" id="qs-course"><option>BUS 202</option><option>BUS 210</option><option>BUS 305</option></select></div>'+
    '<div class="fg"><label class="fl">Room / Location Address</label><input class="fi" id="qs-room" value="Room 304, Faculty of Business" placeholder="e.g. Room 304, Faculty of Business"></div>'+
    '<div class="fg"><label class="fl">Session Duration</label><select class="fi" id="qs-mins"><option value="5">5 minutes</option><option value="10" selected>10 minutes</option><option value="15">15 minutes</option><option value="30">30 minutes</option></select></div>'+
    '<div style="background:rgba(59,123,248,.07);border:1px solid rgba(59,123,248,.15);border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:11px;color:var(--t3)">📍 Students must be inside the GPS radius of this location and pass Face ID to check in. Only one check-in per device is allowed per session.</div>'+
    '<button class="btn grn ful" onclick="createQR()" style="padding:13px">📡 Generate QR Code</button></div>'+
    '<div class="card" id="qrCardWrap"><div class="qr-empty" id="qrEmpty"><div class="qr-empty-icon">📡</div><div style="font-weight:700;color:var(--t2)">No active session</div><div style="font-size:12px">Fill in the details and generate a QR code</div></div>'+
    '<div class="qr-stage" id="qrStage" style="display:none"><div class="qr-stage-corner tl"></div><div class="qr-stage-corner tr"></div><div class="qr-stage-corner bl"></div><div class="qr-stage-corner br"></div>'+
    '<div class="qr-course-name" id="qrName">BUS 202</div><div class="qr-session-meta" id="qrMeta">Room 304</div>'+
    '<div class="qr-canvas-wrap"><div id="qrCode"></div><div class="qr-scan-line"></div></div>'+
    '<div class="qr-countdown" id="qrTimer">--:--</div><div class="qr-countdown-sub">Time remaining</div></div>'+
    '<div style="display:none;gap:8px;margin-top:14px;flex-wrap:wrap" id="qrActions"><button class="btn ghost sm" onclick="regenQR()">🔄 Regenerate</button><button class="btn grn sm" onclick="shareQRWhatsApp()">📲 Share via WhatsApp</button><button class="btn danger sm" onclick="endSession()">⏹ End Session</button></div></div></div>'+
    '<div class="card"><div class="sec-head"><div class="sec-title">Live Check-in Feed</div><span class="badge green"><span id="scanCount">0</span> Checked In</span></div><div class="feed" id="qrFeed"><div style="font-size:12px;color:var(--t4);text-align:center;padding:24px 0">Generate a QR code to start receiving check-ins</div></div></div>';},
  sessions:function(){return'<div class="page-title">My Sessions</div><div class="page-sub">Session history</div><div class="card"><table class="dtab"><thead><tr><th>Course</th><th>Date</th><th>Location</th><th>Attendance</th><th>Status</th></tr></thead><tbody>'+
    [['BUS 202','Apr 20, 2026','Room 304, Faculty of Business',182,240,'closed'],['BUS 210','Apr 19, 2026','Room 112, Faculty of Business',95,110,'closed'],['BUS 202','Apr 18, 2026','Room 304, Faculty of Business',201,240,'closed']]
    .map(function(s){return'<tr><td style="font-weight:700;color:var(--t1)">'+s[0]+'</td><td>'+s[1]+'</td><td>📍 '+s[2]+'</td><td>'+s[3]+'/'+s[4]+' ('+Math.round(s[3]/s[4]*100)+'%)</td><td><span class="badge gray">Closed</span></td></tr>';}).join('')+'</tbody></table></div>';},
  students:function(){return'<div class="page-title">Student Roster</div><div class="page-sub">BUS 202 · 240 enrolled</div><div class="card"><table class="dtab"><thead><tr><th>Student</th><th>Attendance</th><th>Grade</th><th>Status</th></tr></thead><tbody>'+
    [['Alex Johnson',73,'B-','ok'],['Marcus Clive',42,'D','risk'],['Amaka Eze',91,'A-','ok']].map(function(s){return'<tr><td style="font-weight:700;color:var(--t1)">'+s[0]+'</td><td>'+s[1]+'%</td><td>'+s[2]+'</td><td><span class="badge '+(s[3]==='risk'?'red':'green')+'">'+(s[3]==='risk'?'At Risk':'Good')+'</span></td></tr>';}).join('')+'</tbody></table></div>';},
  analytics:function(){return'<div class="page-title">Analytics</div><div class="page-sub">Attendance trends across your sections</div><div class="card"><div class="sec-title" style="margin-bottom:12px">Weekly Attendance</div><div class="bchart">'+
    [62,71,68,74,70,76,73].map(function(v,i){return'<div class="bbar'+(v>73?' hi':'')+'" style="height:'+v+'%"></div>';}).join('')+'</div><div class="bbar-lbls">'+['M','T','W','T','F','S','S'].map(function(d){return'<span>'+d+'</span>';}).join('')+'</div></div>';},
  override:function(){return'<div class="page-title">Manual Override</div><div class="page-sub">Manually mark attendance for a student</div><div class="card" style="max-width:480px"><div class="fg"><label class="fl">Student</label><input class="fi" placeholder="Search student..."></div><div class="fg"><label class="fl">Course Session</label><select class="fi"><option>BUS 202 — Apr 20, 10:00 AM</option></select></div><div class="fg"><label class="fl">Status</label><select class="fi"><option>Present</option><option>Late</option><option>Excused Absence</option></select></div><div class="fg"><label class="fl">Reason</label><textarea class="fi" placeholder="Reason for manual override..."></textarea></div><button class="btn pri ful" onclick="toast(\'✅ Attendance manually updated\')">Apply Override</button></div>';}
},
advisor:{
  home:function(){return'<div class="page-title">Good morning, Advisor Smith 📋</div><div class="page-sub">20 advisees under your care</div>'+
    '<div class="mrow"><div class="mc red"><div class="mc-ic">🚨</div><div class="mc-v">2</div><div class="mc-l">High Risk</div><div class="mc-t dn">Need attention</div></div><div class="mc amber"><div class="mc-ic">⚠️</div><div class="mc-v">6</div><div class="mc-l">Moderate Risk</div><div class="mc-t nt">Watching</div></div><div class="mc green"><div class="mc-ic">✅</div><div class="mc-v">83%</div><div class="mc-l">Recovery Rate</div><div class="mc-t up">↑ 5%</div></div><div class="mc blue"><div class="mc-ic">👥</div><div class="mc-v">20</div><div class="mc-l">Advisees</div><div class="mc-t nt">→ Stable</div></div></div>'+
    (AUTO_ADVISOR_ALERTS.length?'<div class="alcard ra"><div class="al-ico">🔔</div><div><div class="al-title">Auto-Alert — 3 consecutive absences detected</div><div class="al-sub">'+AUTO_ADVISOR_ALERTS[0].name+' missed 3 consecutive '+AUTO_ADVISOR_ALERTS[0].course+' sessions. Automatically flagged for follow-up.</div></div></div>':'')+
    '<div class="alcard ra"><div class="al-ico">🚨</div><div style="flex:1"><div class="al-title">Marcus Clive — Absent 5 consecutive days</div><div class="al-sub">Attendance at 42%. Auto-alert triggered after 3rd consecutive miss.</div></div><button class="btn danger sm" onclick="studentProfileModal(\'Marcus Clive\')">View →</button></div>';},
  advisees:function(){return'<div class="page-title">My Advisees</div><div class="page-sub">20 students</div><div class="card"><table class="dtab"><thead><tr><th>Student</th><th>Attendance</th><th>Risk</th><th>Action</th></tr></thead><tbody>'+
    [['Marcus Clive',42,'High'],['Samantha Okonkwo',38,'High'],['Alex Johnson',73,'Moderate'],['Amaka Eze',91,'Low']].map(function(s){return'<tr><td style="font-weight:700;color:var(--t1)">'+s[0]+'</td><td>'+s[1]+'%</td><td><span class="badge '+(s[2]==='High'?'red':s[2]==='Moderate'?'amber':'green')+'">'+s[2]+'</span></td><td><button class="btn ghost sm" onclick="studentProfileModal(\''+s[0]+'\')">View</button></td></tr>';}).join('')+'</tbody></table></div>';},
  alerts:function(){
    var autoRows=AUTO_ADVISOR_ALERTS.map(function(a){return'<div class="alcard ra"><div class="al-ico">🔔</div><div><div class="al-title">'+a.name+' — Auto-alert: 3 consecutive absences</div><div class="al-sub">'+a.course+' · Flagged automatically at '+a.ts.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})+'</div></div></div>';}).join('');
    return'<div class="page-title">Priority Alerts</div><div class="page-sub">2 high-risk students</div>'+autoRows+
    '<div class="alcard ra"><div class="al-ico">🚨</div><div><div class="al-title">Marcus Clive — Critical</div><div class="al-sub">42% attendance. 5 consecutive absences. Auto-alert sent after 3rd consecutive miss.</div></div></div>'+
    '<div class="alcard aa"><div class="al-ico">⚠️</div><div><div class="al-title">Samantha Okonkwo — Declining</div><div class="al-sub">38% attendance, dropped 12% this month.</div></div></div>';},
  intervene:function(){return'<div class="page-title">Log Intervention</div><div class="page-sub">Record a support action for an advisee</div><div class="card" style="max-width:480px"><div class="fg"><label class="fl">Student</label><input class="fi" placeholder="Search student..."></div><div class="fg"><label class="fl">Intervention Type</label><select class="fi"><option>Meeting</option><option>Email</option><option>Phone Call</option><option>Referral</option></select></div><div class="fg"><label class="fl">Notes</label><textarea class="fi" placeholder="Details of the intervention..."></textarea></div><button class="btn pri ful" onclick="toast(\'✅ Intervention logged\')">Save Intervention</button></div>';},
  analytics:function(){return'<div class="page-title">Analytics</div><div class="page-sub">Advisee outcomes over time</div><div class="card"><div class="sec-title" style="margin-bottom:12px">Intervention Success Rate</div><div class="donut-w"><svg width="110" height="110"><circle cx="55" cy="55" r="46" fill="none" stroke="#1D2330" stroke-width="10"/><circle cx="55" cy="55" r="46" fill="none" stroke="#F5A623" stroke-width="10" stroke-dasharray="289" stroke-dashoffset="49"/></svg><div class="donut-l"><div class="dpct">83%</div><div class="dsub">Success</div></div></div></div>';},
  profile:function(){return'<div class="page-title">My Profile</div><div class="page-sub">Advisor Smith · Student Affairs</div><div class="card"><div class="frow"><div class="fg"><label class="fl">Email</label><input class="fi" value="advisor.smith@uni.edu" readonly></div><div class="fg"><label class="fl">Office</label><input class="fi" value="Student Affairs, Rm 12" readonly></div></div></div>';}
},
hod:{
  home:function(){return'<div class="page-title">Welcome, Dr. Ibrahim 🏢</div><div class="page-sub">Head of Department · Computer Science</div>'+
    '<div class="mrow"><div class="mc blue"><div class="mc-ic">🎓</div><div class="mc-v">420</div><div class="mc-l">Students</div><div class="mc-t nt">→ Dept total</div></div><div class="mc green"><div class="mc-ic">📊</div><div class="mc-v">86%</div><div class="mc-l">Dept Avg</div><div class="mc-t up">↑ 2% this month</div></div><div class="mc amber"><div class="mc-ic">🧑‍🏫</div><div class="mc-v">12</div><div class="mc-l">Faculty</div><div class="mc-t nt">→ Active</div></div><div class="mc red"><div class="mc-ic">⚠️</div><div class="mc-v">31</div><div class="mc-l">At-Risk</div><div class="mc-t dn">↑ Needs review</div></div></div>'+
    '<div class="g60"><div class="card"><div class="sec-head"><div class="sec-title">Course Attendance</div></div>'+
    [['CS 101',88,'green'],['CS 210',74,'amber'],['CS 305',91,'green'],['CS 410',58,'red']].map(function(c){return'<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span style="color:var(--t2)">'+c[0]+'</span><span style="font-weight:800;color:'+(c[2]==='green'?'var(--green)':c[2]==='red'?'var(--red)':'var(--amber)')+'">'+c[1]+'%</span></div><div class="prog"><div class="pf '+c[2]+'" data-w="'+c[1]+'"></div></div></div>';}).join('')+
    '</div><div class="card"><div class="sec-title" style="margin-bottom:12px">Faculty Snapshot</div>'+
    [['Prof. Adeyemi','CS 101',92],['Dr. Vance','CS 210',74],['Dr. Chukwu','CS 305',91]].map(function(f){return'<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--brd)"><div><div style="font-size:13px;font-weight:700;color:var(--t1)">'+f[0]+'</div><div style="font-size:11px;color:var(--t3)">'+f[1]+'</div></div><span class="badge '+(f[2]>=85?'green':f[2]>=70?'amber':'red')+'">'+f[2]+'%</span></div>';}).join('')+'</div></div>';},
  courses:function(){return'<div class="page-title">Department Courses</div><div class="page-sub">Computer Science · 9 courses</div><div class="card"><table class="dtab"><thead><tr><th>Course</th><th>Lecturer</th><th>Enrolled</th><th>Attendance</th></tr></thead><tbody>'+
    [['CS 101','Prof. Adeyemi',180,88],['CS 210','Dr. Vance',95,74],['CS 305','Dr. Chukwu',60,91],['CS 410','Dr. Bello',45,58]].map(function(c){return'<tr><td style="font-weight:700;color:var(--t1)">'+c[0]+'</td><td>'+c[1]+'</td><td>'+c[2]+'</td><td>'+c[3]+'%</td></tr>';}).join('')+'</tbody></table></div>';},
  faculty:function(){return'<div class="page-title">Faculty</div><div class="page-sub">12 lecturers in Computer Science</div><div class="card"><table class="dtab"><thead><tr><th>Name</th><th>Course(s)</th><th>Avg Attendance</th><th>Status</th></tr></thead><tbody>'+
    [['Prof. Adeyemi','CS 101',92],['Dr. Vance','CS 210',74],['Dr. Chukwu','CS 305',91]].map(function(f){return'<tr><td style="font-weight:700;color:var(--t1)">'+f[0]+'</td><td>'+f[1]+'</td><td>'+f[2]+'%</td><td><span class="badge green">Active</span></td></tr>';}).join('')+'</tbody></table></div>';},
  students:function(){return'<div class="page-title">Students</div><div class="page-sub">Computer Science · 420 enrolled</div><div class="card"><table class="dtab"><thead><tr><th>Student</th><th>Year</th><th>Attendance</th><th>Status</th></tr></thead><tbody>'+
    [['Alex Johnson','Year 2',73,'ok'],['Marcus Clive','Year 3',42,'risk']].map(function(s){return'<tr><td style="font-weight:700;color:var(--t1)">'+s[0]+'</td><td>'+s[1]+'</td><td>'+s[2]+'%</td><td><span class="badge '+(s[3]==='risk'?'red':'green')+'">'+(s[3]==='risk'?'At Risk':'Good')+'</span></td></tr>';}).join('')+'</tbody></table></div>';},
  reports:function(){return'<div class="page-title">Reports</div><div class="page-sub">Department performance reports</div><div class="g2">'+
    [['📊','Attendance Summary','Term overview by course'],['📈','Faculty Performance','Lecturer engagement scores'],['⚠️','At-Risk Report','Students flagged this term'],['📁','Export All Data','CSV / PDF export']]
    .map(function(r){return'<div class="report-card" onclick="toast(\'📄 Generating '+r[1]+'...\')"><div style="font-size:24px;margin-bottom:8px">'+r[0]+'</div><div style="font-weight:800;color:var(--t1);margin-bottom:3px">'+r[1]+'</div><div style="font-size:12px;color:var(--t3)">'+r[2]+'</div></div>';}).join('')+'</div>';},
  settings:function(){return'<div class="page-title">Settings</div><div class="page-sub">Department preferences</div><div class="card">'+
    ['Auto-alert advisor after 3 absences','Require GPS + Face ID for check-in','Weekly report emails'].map(function(n){return'<div class="setting-row"><div class="sr-label">'+n+'</div><div class="ntoggle on" onclick="togNtf(this)"></div></div>';}).join('')+'</div>';}
},
admin:{
  home:function(){return'<div class="page-title">Good morning, Dean Williams 🏛</div><div class="page-sub">Computer Science Department Overview</div>'+
    '<div class="mrow"><div class="mc blue"><div class="mc-ic">🎓</div><div class="mc-v">1,240</div><div class="mc-l">Students</div><div class="mc-t nt">→ Stable</div></div><div class="mc red"><div class="mc-ic">⚠️</div><div class="mc-v">156</div><div class="mc-l">At-Risk</div><div class="mc-t dn">↑ 32 courses</div></div><div class="mc green"><div class="mc-ic">📊</div><div class="mc-v">81%</div><div class="mc-l">Dept Avg</div><div class="mc-t up">↑ 1%</div></div><div class="mc amber"><div class="mc-ic">📚</div><div class="mc-v">32</div><div class="mc-l">Courses</div><div class="mc-t nt">→ Active</div></div></div>'+
    '<div class="card"><div class="sec-title" style="margin-bottom:12px">Attendance Trend</div><div class="bchart">'+[68,71,74,78,76,81,79].map(function(v){return'<div class="bbar'+(v>78?' hi':'')+'" style="height:'+v+'%"></div>';}).join('')+'</div></div>';},
  courses:function(){return'<div class="page-title">All Courses</div><div class="page-sub">32 courses across department</div><div class="card"><table class="dtab"><thead><tr><th>Course</th><th>Lecturer</th><th>Enrolled</th><th>Attendance</th></tr></thead><tbody>'+
    [['BUS 202','Dr. Vance',240,89],['CS 101','Prof. Adeyemi',180,88]].map(function(c){return'<tr><td style="font-weight:700;color:var(--t1)">'+c[0]+'</td><td>'+c[1]+'</td><td>'+c[2]+'</td><td>'+c[3]+'%</td></tr>';}).join('')+'</tbody></table></div>';},
  students:function(){return'<div class="page-title">All Students</div><div class="page-sub">1,240 enrolled</div><div class="card"><table class="dtab"><thead><tr><th>Student</th><th>Dept</th><th>Attendance</th><th>Status</th></tr></thead><tbody>'+
    [['Alex Johnson','Computer Science',73,'ok'],['Marcus Clive','Biology',42,'risk']].map(function(s){return'<tr><td style="font-weight:700;color:var(--t1)">'+s[0]+'</td><td>'+s[1]+'</td><td>'+s[2]+'%</td><td><span class="badge '+(s[3]==='risk'?'red':'green')+'">'+(s[3]==='risk'?'At Risk':'Good')+'</span></td></tr>';}).join('')+'</tbody></table></div>';},
  reports:function(){return'<div class="page-title">Reports</div><div class="page-sub">Department-wide reports</div><div class="g2">'+
    [['📊','Attendance Summary','Term overview'],['📈','Faculty Performance','Lecturer scores'],['⚠️','At-Risk Report','Flagged students'],['📁','Export All Data','CSV / PDF']]
    .map(function(r){return'<div class="report-card" onclick="toast(\'📄 Generating '+r[1]+'...\')"><div style="font-size:24px;margin-bottom:8px">'+r[0]+'</div><div style="font-weight:800;color:var(--t1);margin-bottom:3px">'+r[1]+'</div><div style="font-size:12px;color:var(--t3)">'+r[2]+'</div></div>';}).join('')+'</div>';},
  accounts:accountsView,
  settings:function(){return'<div class="page-title">Settings</div><div class="page-sub">Department admin preferences</div><div class="card">'+
    ['Auto-alert advisor after 3 absences','Require GPS + Face ID for check-in','Weekly report emails'].map(function(n){return'<div class="setting-row"><div class="sr-label">'+n+'</div><div class="ntoggle on" onclick="togNtf(this)"></div></div>';}).join('')+'</div>';}
},
provost:{
  home:function(){return'<div class="page-title">Welcome, Deputy Provost Adeyemi 🎖️</div><div class="page-sub">University-wide overview</div>'+
    '<div class="mrow"><div class="mc blue"><div class="mc-ic">🎓</div><div class="mc-v">12,400</div><div class="mc-l">Students</div><div class="mc-t nt">→ University</div></div><div class="mc green"><div class="mc-ic">📊</div><div class="mc-v">84%</div><div class="mc-l">Uni Avg</div><div class="mc-t up">↑ Stable</div></div><div class="mc amber"><div class="mc-ic">🏫</div><div class="mc-v">8</div><div class="mc-l">Departments</div><div class="mc-t nt">→ Active</div></div><div class="mc red"><div class="mc-ic">👤</div><div class="mc-v">3,820</div><div class="mc-l">Accounts</div><div class="mc-t nt">→ All roles</div></div></div>'+
    '<div class="card"><div class="sec-title" style="margin-bottom:12px">Departmental Attendance</div>'+
    [['Computer Science',86,'green'],['Business',81,'amber'],['Biology',74,'amber'],['Mathematics',89,'green']].map(function(c){return'<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span style="color:var(--t2)">'+c[0]+'</span><span style="font-weight:800;color:'+(c[2]==='green'?'var(--green)':'var(--amber)')+'">'+c[1]+'%</span></div><div class="prog"><div class="pf '+c[2]+'" data-w="'+c[1]+'"></div></div></div>';}).join('')+'</div>';},
  departments:function(){return'<div class="page-title">Departments</div><div class="page-sub">8 departments university-wide</div><div class="g2">'+
    [['Computer Science',420,86],['Business',380,81],['Biology',310,74],['Mathematics',260,89]].map(function(d){return'<div class="card"><div style="font-size:15px;font-weight:800;color:var(--t1);margin-bottom:6px">'+d[0]+'</div><div style="font-size:12px;color:var(--t3);margin-bottom:8px">'+d[1]+' students</div><div class="prog"><div class="pf green" data-w="'+d[2]+'"></div></div></div>';}).join('')+'</div>';},
  faculty:function(){return'<div class="page-title">Faculty & Staff</div><div class="page-sub">University-wide faculty directory</div><div class="card"><table class="dtab"><thead><tr><th>Name</th><th>Department</th><th>Role</th></tr></thead><tbody>'+
    [['Dr. Vance','Business','Lecturer'],['Prof. Adeyemi','Computer Science','Lecturer'],['Dr. Ibrahim','Computer Science','HOD']].map(function(f){return'<tr><td style="font-weight:700;color:var(--t1)">'+f[0]+'</td><td>'+f[1]+'</td><td>'+f[2]+'</td></tr>';}).join('')+'</tbody></table></div>';},
  reports:function(){return'<div class="page-title">Strategic Reports</div><div class="page-sub">University-wide strategic analytics</div><div class="g2">'+
    [['📊','Attendance Summary','University overview'],['📈','Retention Analysis','Cross-department trends'],['⚠️','At-Risk Report','All flagged students'],['📁','Export All Data','CSV / PDF']]
    .map(function(r){return'<div class="report-card" onclick="toast(\'📄 Generating '+r[1]+'...\')"><div style="font-size:24px;margin-bottom:8px">'+r[0]+'</div><div style="font-weight:800;color:var(--t1);margin-bottom:3px">'+r[1]+'</div><div style="font-size:12px;color:var(--t3)">'+r[2]+'</div></div>';}).join('')+'</div>';},
  accounts:accountsView,
  settings:function(){return'<div class="page-title">Settings</div><div class="page-sub">University-wide preferences</div><div class="card">'+
    ['Auto-alert advisor after 3 absences','Require GPS + Face ID for check-in','Weekly report emails'].map(function(n){return'<div class="setting-row"><div class="sr-label">'+n+'</div><div class="ntoggle on" onclick="togNtf(this)"></div></div>';}).join('')+'</div>';}
}
};
