// AttendiQ — Role configs, nav, account store
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
    demo:{e:'advisor.smith@uni.edu',p:'advisor123'},name:'Advisor Smith',ini:'AS',role:'Academic Advisor',avBg:'#F5A623'},
  admin:{ac:'#8B5CF6',rgb:'139,92,246',visBg:'linear-gradient(140deg,#060410,#0d0820 50%,#130c30)',
    glows:[{c:'#8B5CF6',o:.18,s:'520px',t:'-130px',l:'-110px'},{c:'#7C3AED',o:.1,s:'310px',b:'-60px',r:'0'}],
    pat:'background-image:linear-gradient(rgba(139,92,246,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.04) 1px,transparent 1px);background-size:24px 24px',
    floats:[{t:'15%',r:'10%',l:'Dept. Enrollment',v:'1,240',s:'Students this sem',vc:'#C4B5FD'},{t:'43%',r:'7%',l:'At-Risk',v:'156',s:'32 courses'},{t:'67%',r:'12%',l:'Dept Avg',v:'81%',s:'Weekly'}],
    ey:'Admin Portal · Spring 2026',big:'Institution-wide<br>intelligence, <span style="color:#C4B5FD">one view.</span>',
    para:'Full department oversight — attendance trends, faculty performance and retention analytics.',
    stats:[{v:'1,240',l:'Students'},{v:'32',l:'Courses'},{v:'81%',l:'Dept avg'}],
    fbg:'#060410',chip:{bg:'rgba(139,92,246,.12)',bd:'rgba(139,92,246,.28)',c:'#DDD6FE',tx:'🏛  Admin / Dean Access'},
    btnBg:'linear-gradient(135deg,#8B5CF6,#7C3AED)',btnSh:'rgba(139,92,246,.35)',ac2:'#C4B5FD',sso:'Admin SSO',
    demo:{e:'dean.williams@uni.edu',p:'admin123'},name:'Dean Williams',ini:'DW',role:'Department Head',avBg:'#8B5CF6'},
  provost:{ac:'#14C882',rgb:'20,200,130',visBg:'linear-gradient(140deg,#030f09,#051a10 50%,#082515)',
    glows:[{c:'#14C882',o:.18,s:'500px',t:'-130px',l:'-100px'},{c:'#0DA86E',o:.1,s:'300px',b:'-60px',r:'0'}],
    pat:'background-image:linear-gradient(rgba(20,200,130,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(20,200,130,.04) 1px,transparent 1px);background-size:44px 44px',
    floats:[{t:'14%',r:'9%',l:'University',v:'12,400',s:'Students enrolled',vc:'#2EE89A'},{t:'43%',r:'7%',l:'Institutional Avg',v:'84%',s:'Attendance'},{t:'67%',r:'12%',l:'Active Accounts',v:'3,820',s:'All roles'}],
    ey:'Provost Portal · Spring 2026',big:'University-wide<br>authority, <span style="color:#2EE89A">one portal.</span>',
    para:'Full institutional oversight — all departments, all accounts, strategic analytics and executive control.',
    stats:[{v:'12,400',l:'Students'},{v:'8',l:'Depts'},{v:'84%',l:'Uni avg'}],
    fbg:'#030f09',chip:{bg:'rgba(20,200,130,.12)',bd:'rgba(20,200,130,.28)',c:'#6EE7C0',tx:'🎖️  Provost Access'},
    btnBg:'linear-gradient(135deg,#14C882,#0DA86E)',btnSh:'rgba(20,200,130,.3)',ac2:'#2EE89A',sso:'Executive SSO',
    demo:{e:'provost@uni.edu',p:'provost123'},name:'Provost Adeyemi',ini:'PA',role:'University Provost',avBg:'#14C882'},
};

/* NAV CONFIG */
var NAV={
  student:[{id:'home',ic:'🏠',lb:'Home'},{id:'courses',ic:'📚',lb:'My Courses'},{id:'scan',ic:'⬛',lb:'Scan QR Code'},{id:'calendar',ic:'📅',lb:'Calendar'},{id:'alerts',ic:'🔔',lb:'Alerts & Tips',bg:'3'},{id:'profile',ic:'👤',lb:'Profile & Settings'}],
  lecturer:[{id:'home',ic:'🏠',lb:'Dashboard'},{id:'create',ic:'📡',lb:'Create QR Session'},{id:'sessions',ic:'🗂',lb:'My Sessions'},{id:'students',ic:'👥',lb:'Student Roster'},{id:'analytics',ic:'📊',lb:'Analytics'},{id:'override',ic:'✏️',lb:'Manual Override'}],
  advisor:[{id:'home',ic:'🏠',lb:'Dashboard'},{id:'advisees',ic:'👥',lb:'My Advisees',bg:'8'},{id:'alerts',ic:'⚠️',lb:'Priority Alerts',bg:'2'},{id:'intervene',ic:'📝',lb:'Log Intervention'},{id:'analytics',ic:'📊',lb:'Analytics'},{id:'profile',ic:'👤',lb:'My Profile'}],
  admin:[{id:'home',ic:'🏠',lb:'Overview'},{id:'courses',ic:'📚',lb:'All Courses'},{id:'students',ic:'👥',lb:'All Students'},{id:'reports',ic:'📊',lb:'Reports'},{id:'accounts',ic:'👤',lb:'Manage Accounts'},{id:'settings',ic:'⚙️',lb:'Settings'}],
  provost:[{id:'home',ic:'🏠',lb:'Overview'},{id:'departments',ic:'🏫',lb:'Departments'},{id:'faculty',ic:'🧑‍🏫',lb:'Faculty & Staff'},{id:'reports',ic:'📊',lb:'Strategic Reports'},{id:'accounts',ic:'👤',lb:'Manage Accounts',bg:'NEW'},{id:'settings',ic:'⚙️',lb:'Settings'}],
};

/* ACCOUNT STORE */
var ACCOUNT_STORE={
  students:[{id:'STU-001',name:'Alex Johnson',email:'alex.johnson@uni.edu',role:'student',dept:'Computer Science',status:'active',created:'Jan 10, 2026'},{id:'STU-002',name:'Marcus Clive',email:'marcus.clive@uni.edu',role:'student',dept:'Biology',status:'active',created:'Jan 10, 2026'},{id:'STU-003',name:'Amaka Eze',email:'amaka.eze@uni.edu',role:'student',dept:'Business',status:'active',created:'Jan 10, 2026'}],
  lecturers:[{id:'LEC-001',name:'Dr. Vance',email:'dr.vance@uni.edu',role:'lecturer',dept:'Business',status:'active',created:'Aug 1, 2025'},{id:'LEC-002',name:'Prof. Adeyemi',email:'prof.adeyemi@uni.edu',role:'lecturer',dept:'Computer Science',status:'active',created:'Aug 1, 2025'}],
  advisors:[{id:'ADV-001',name:'Advisor Smith',email:'advisor.smith@uni.edu',role:'advisor',dept:'Student Affairs',status:'active',created:'Aug 1, 2025'}],
  admins:[{id:'ADM-001',name:'Dean Williams',email:'dean.williams@uni.edu',role:'admin',dept:'Computer Science',status:'active',created:'Jan 1, 2025'}],
  provosts:[{id:'PRV-001',name:'Provost Adeyemi',email:'provost@uni.edu',role:'provost',dept:'University Administration',status:'active',created:'Jan 1, 2025'}],
};
