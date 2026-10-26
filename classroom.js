// Classroom release: durable progress, clear pair submission, and an interactive timeline.
(function () {
  const KEY = 'digital-decisions-case01-v2';
  const route = [0,1,1.5,2,2.5,3,3.5,4,4.5,4.75,5,6,7];
  const draft = { first: '', second: '', verdict: '', received: '', downloaded: '' };
  let timeline = [];
  let restored = false;
  let suppressSave = false;

  const css = document.createElement('style');
  css.textContent = `.case-instructions{background:#203d4d;border:1px solid #5e988f;border-left:5px solid #62e0bf;border-radius:12px;padding:22px;margin:20px 0;color:#effaff}
    .case-instructions p,.case-instructions li{color:#e0f0f6}
    .timeline-card{display:block;width:100%;padding:17px;margin:10px 0;text-align:left;background:#1b3449;color:#eff7fc;border:1px solid #54738a;border-radius:10px;line-height:1.5}
    .timeline-card:hover,.timeline-card:focus-visible{background:#2c5867}
    .timeline-card:disabled{opacity:.48;cursor:default}
    .timeline-slots{display:grid;gap:10px;margin:12px 0 24px}
    .timeline-slot{border:1px dashed #77a6b2;border-radius:9px;padding:14px;background:#17374b;min-height:52px}
    .save-status{color:#9be9cc;font-size:13px}
    .submit-list{color:#e0f0f6;padding-left:24px;line-height:1.8}
    .danger{border-color:#aa6972!important;color:#ffd9dc!important}`;
  document.head.appendChild(css);

  const priorDraw = draw;
  draw = function (html) { priorDraw(html); if (!suppressSave && step >= 0) save(); };
  const priorFrame = frame;
  frame = function (content) {
    const current = route.indexOf(step);
    const title = stepNames[step] || 'Investigation';
    draw(`<section class="screen"><div class="tag">Case 01 / Account Compromised · Stage ${current + 1} of ${route.length}</div><h2>${title}</h2><div class="progress">${route.map((_,i)=>`<i class="${i<=current?'done':''}"></i>`).join('')}</div>${content}</section>`);
  };

  function capture() {
    const ids = { investigator1:'first', investigator2:'second', verdictText:'verdict', adviceReceived:'received', adviceDownloaded:'downloaded' };
    for (const [id, key] of Object.entries(ids)) {
      const el = document.getElementById(id);
      if (el) draft[key] = el.value;
    }
  }
  function rehydrate() {
    const ids = { investigator1:'first', investigator2:'second', verdictText:'verdict', adviceReceived:'received', adviceDownloaded:'downloaded' };
    for (const [id, key] of Object.entries(ids)) {
      const el = document.getElementById(id);
      if (el && draft[key] && el.value !== draft[key]) el.value = draft[key];
    }
  }
  function snapshot() {
    return { version: 2, step, team, answers, verdictText, quiz, quizScore, draft, timeline,
      extra: window.getDigitalDecisionsExtras?.().state || {} };
  }
  function save() {
    if (suppressSave || step < 0) return;
    try { localStorage.setItem(KEY, JSON.stringify(snapshot())); } catch (_) { /* private browsing may block storage */ }
  }
  function saved() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { return null; }
  }
  function restore(state) {
    if (!state || state.version !== 2) return false;
    suppressSave = true;
    step = route.includes(state.step) ? state.step : 0;
    team = typeof state.team === 'string' ? state.team : '';
    answers = state.answers || {};
    verdictText = state.verdictText || '';
    quiz = state.quiz || {};
    quizScore = Number(state.quizScore) || 0;
    Object.assign(draft, state.draft || {});
    timeline = Array.isArray(state.timeline) ? state.timeline.filter(x=>Number.isInteger(x)&&x>=0&&x<=3).slice(0,4) : [];
    window.setDigitalDecisionsExtras?.(state.extra || {});
    suppressSave = false;
    restored = true;
    render();
    return true;
  }

  document.addEventListener('input', function (event) {
    if (['investigator1','investigator2','verdictText','adviceReceived','adviceDownloaded'].includes(event.target.id)) {
      capture(); save();
    }
  });

  // Strengthen common near-miss responses while preserving the existing answer keys.
  const originalChoices = choices;
  choices = function (id, items) {
    const better = {
      email: ['Open the link only after confirming the sender display name','Use the known school site or established IT contact independently','Reply to ask whether the warning is genuine'],
      password: ['Hornets2026!Hornets2026!','C0mputerScience2026!','cobalt-window-river-otter-42'],
      mfa: ['The second factor is only needed when the password is entered incorrectly','The person would also need the second factor or would have to trick Avery into approving the sign-in','Avery would never receive an alert because the password was correct'],
      malware: ['Ask Avery whether the link is safe, then download it if Avery agrees','Leave the link unopened and report the message through a trusted school IT channel','Forward a screenshot containing the live link to the class group chat for advice'],
      recovery: ['Report and investigate the incident, change the password through the real school site, sign out unfamiliar sessions and review MFA','Change the password but leave the unfamiliar session active until tomorrow','Delete the sent message and wait for another alert']
    };
    return originalChoices(id, better[id] || items);
  };
  qs[0][1] = ['The message arrived outside school hours','Its sender domain is not verified as the school domain','Its subject contains the word account'];
  qs[2][1] = ['Use one memorable password on school and gaming accounts','Use a long unique passphrase or a password manager-generated password','Add an exclamation point to an old password'];
  qs[4][1] = ['Scan it, and run it if the scanner finds nothing','Ask the sender to resend it','Do not run it; report it and follow approved scanning procedures'];

  const previousRender = render;
  render = function () {
    capture();
    if (step === 0) renderBriefing();
    else if (step === 2) renderTimeline();
    else previousRender();
    if (step === 5) {
      const target = document.getElementById('verdictText');
      if (target && !document.getElementById('verdictChecklist')) {
        target.insertAdjacentHTML('beforebegin', `<div id="verdictChecklist" class="case-instructions"><b>Include all four in your explanation:</b><ol class="submit-list"><li>Two specific pieces of evidence.</li><li>What you think happened to the account.</li><li>One action to prevent more damage.</li><li>One detail the evidence cannot prove.</li></ol></div>`);
        const hint = target.parentElement.querySelector('.muted');
        if (hint) hint.textContent = 'Write a short paragraph (at least 120 characters). Your explanation will appear in the PDF.';
      }
    }
    if (step === 7) improveCompletion();
    rehydrate();
    save();
  };

  function renderBriefing() {
    const first = esc(draft.first), second = esc(draft.second);
    frame(`<p>At 7:52 Monday morning, a suspicious download link was sent from Avery Chen's school account to 28 classmates. Avery says they never sent it. A successful login from an unfamiliar device appeared after midnight. You're assigned to investigate what happened.</p>
      <div class="panel"><div class="tag">Your assignment · One report per pair</div><h3>Investigate the account breach</h3><p>Examine messages and login records, test possible explanations, recommend safety measures, and write a final report. Be careful: a reasonable explanation is not always a proven fact.</p>
      <div class="case-instructions"><b>Before you begin</b><ol class="submit-list"><li>Enter both investigators' first and last names.</li><li>Work through decisions together and explain your thinking.</li><li>Complete one knowledge check as a pair.</li><li>Download and submit one PDF report to Google Classroom.</li></ol><p>Progress saves in this browser on this device. Avoid private browsing or clearing browser data before submitting. Never enter a real password into the game.</p></div>
      <label for="investigator1">Investigator 1 · First and last name</label><input id="investigator1" maxlength="80" value="${first}" placeholder="First Last" autocomplete="off">
      <label for="investigator2">Investigator 2 · First and last name</label><input id="investigator2" maxlength="80" value="${second}" placeholder="First Last" autocomplete="off">
      <p id="nameError" class="note" style="display:none" role="alert"></p><button class="btn" onclick="beginInvestigation()">Accept case →</button><span class="save-status">Progress saves automatically on this browser.</span></div>`);
  }
  window.beginInvestigation = function () {
    capture();
    const valid = name => /^\S+\s+\S+/.test(name.trim());
    if (!valid(draft.first) || !valid(draft.second)) {
      const error = document.getElementById('nameError');
      error.textContent = 'Enter a first and last name for each investigator before beginning.';
      error.style.display = 'block';
      return;
    }
    team = draft.first.trim() + ' & ' + draft.second.trim();
    next();
  };

  const events = [
    ['Sunday · 9:41 PM','Avery opens the urgent account warning.'],
    ['Sunday · 9:43 PM','A password is entered on a lookalike school login page.'],
    ['Monday · 12:16 AM','A successful sign-in uses Avery’s password on an unfamiliar device.'],
    ['Monday · 7:52 AM','The account sends a suspicious download link to 28 classmates.']
  ];
  const shuffled = [3,1,0,2];
  function renderTimeline() {
    const ordered = timeline.length === 4 && timeline.every((id,i)=>id===i);
    const allPlaced = timeline.length === 4;
    const options = shuffled.filter(id=>!timeline.includes(id)).map(id=>`<button class="timeline-card" onclick="addTimeline(${id})"><b>${events[id][0]}</b><div>${events[id][1]}</div></button>`).join('') || '<p class="muted">All cards placed. Check the order below.</p>';
    const slots = [0,1,2,3].map((_,i)=>`<div class="timeline-slot"><b>${i+1}.</b> ${timeline[i]===undefined?'Select the next event above':`<b>${events[timeline[i]][0]}</b> · ${events[timeline[i]][1]}`}</div>`).join('');
    frame(`<p>Technology staff collected four events, but the records arrived out of order. Click each evidence card in the order events happened, earliest to latest. Then decide what the sequence tells you.</p>
      <div class="case-instructions"><b>Investigator task</b><p>Click a card to add it to the timeline. Use Undo or Reset if needed. When all four are placed, check your sequence before drawing a conclusion.</p></div>
      <div class="panel"><h3>Unsorted evidence cards</h3>${options}<div class="noprint"><button class="btn alt" ${timeline.length?'':'disabled'} onclick="undoTimeline()">Undo last card</button><button class="btn alt" ${timeline.length?'':'disabled'} onclick="resetTimeline()">Reset order</button></div><h3>Reconstructed timeline</h3><div class="timeline-slots">${slots}</div>
      ${allPlaced?`<button class="btn" onclick="checkTimeline()">Check timeline</button>`:''}
      ${answers.timelineOrderChecked ? `<div class="note ${ordered?'good':''}">${ordered?'Correct. The records show credential entry before an unfamiliar sign-in and suspicious outgoing messages.':'Not quite. Look closely at the dates and times, then use Reset to try again.'}</div>`:''}</div>
      ${ordered&&answers.timelineOrderChecked?`<div class="panel"><h3>What does this sequence most strongly suggest?</h3>${choices('timeline',['Avery intentionally sent every message','The account was likely compromised following credential entry on a lookalike site','Every recipient downloaded malware'])}${feedback('timeline',1,'The events support a likely phishing-related account compromise, but do not prove the later user’s identity or that anyone ran malware.')}</div>`:''}
      <div class="noprint"><button class="btn alt" onclick="back()">← Review inbox</button><button class="btn" ${ordered&&answers.timelineOrderChecked&&answers.timeline!==undefined?'':'disabled'} onclick="next()">Interview witnesses →</button></div>`);
  }
  window.addTimeline = id => { if(!timeline.includes(id)&&timeline.length<4){timeline.push(id);delete answers.timelineOrderChecked;delete answers.timeline;window.__retainDecisionScroll=true;render();} };
  window.undoTimeline = () => {timeline.pop();delete answers.timelineOrderChecked;delete answers.timeline;window.__retainDecisionScroll=true;render();};
  window.resetTimeline = () => {timeline=[];delete answers.timelineOrderChecked;delete answers.timeline;window.__retainDecisionScroll=true;render();};
  window.checkTimeline = () => {answers.timelineOrderChecked=true;window.__retainDecisionScroll=true;render();};

  function improveCompletion() {
    const screen = document.querySelector('.screen');
    const controls = screen?.querySelector('.noprint');
    if (!controls || document.getElementById('finalSubmission')) return;
    controls.insertAdjacentHTML('beforebegin', `<div id="finalSubmission" class="case-instructions"><h3>Before submitting to Google Classroom</h3><ol class="submit-list"><li>Confirm both investigator names appear in the report.</li><li>Click <b>Download PDF report</b>.</li><li>Open the downloaded PDF and check that the written responses are included.</li><li>Attach the PDF to your assignment in Google Classroom and click Turn in.</li></ol><p>Your completion code is included in the PDF. Keep a copy until the assignment is graded.</p></div>`);
    const reset = document.createElement('button');
    reset.className = 'btn alt danger'; reset.textContent = 'Start a new investigation'; reset.onclick = window.restartInvestigation;
    controls.appendChild(reset);
  }
  const originalSubmit = submitVerdict;
  submitVerdict = function () {
    capture();
    const text = draft.verdict.trim();
    if (answers.verdict === undefined || text.length < 120) {
      alert('Select a conclusion and write at least 120 characters using the four items in the checklist.'); return;
    }
    verdictText = text;
    originalSubmit();
  };
  window.restartInvestigation = function () {
    if (!confirm('Start a new investigation? This deletes the saved answers and names on this browser. Download your PDF first.')) return;
    try { localStorage.removeItem(KEY); } catch (_) {}
    step=-1; team=''; answers={}; verdictText=''; quiz={}; quizScore=0;
    for(const key of Object.keys(draft)) draft[key]=''; timeline=[];
    window.setDigitalDecisionsExtras?.({mail:{},witness:{},auth:{},downloads:{},home:{},memo:'',received:'',downloaded:''});
    home();
  };
  window.getDigitalDecisionsEnhancements = function () { return { timeline: timeline.slice(), investigators: team }; };

  home = function () {
    step=-1;
    const available = saved();
    draw(`<section class="hero"><div class="tag">CS1 · Digital citizenship investigation</div><h1>Every click<br>leaves a clue.</h1><p>Follow evidence through a school account breach. You and your partner will investigate, make decisions, and submit one case report.</p>
      ${available?'<button class="btn" onclick="resumeInvestigation()">Resume saved investigation →</button><button class="btn alt" onclick="restartInvestigation()">Start over</button>':'<button class="btn" onclick="start()">Open Case 01 →</button>'}
      <p class="muted">About 45 minutes · Work in pairs · One PDF per pair</p></section><h2>Investigation file</h2><article class="panel case"><div class="number">01</div><h3>Account Compromised</h3><p>Follow a phishing trail, reconstruct the evidence, and secure a school account.</p><small>AVAILABLE NOW</small></article><p class="muted">The other Digital Decisions investigations will be released separately.</p>`);
  };
  window.resumeInvestigation = function () { if (!restore(saved())) start(); };

  // The initial script drew the original home before this enhancement was loaded.
  if (!restore(saved())) home();
})();
