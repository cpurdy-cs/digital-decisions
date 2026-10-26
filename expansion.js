// Extended classroom investigation: additional evidence-based activities between the core case screens.
// All state remains in the student's browser session; no account or data collection is used.
(function () {
  const oldRender = render;
  const route = [0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 4.75, 5, 6, 7];
  const extra = { mail: {}, witness: {}, auth: {}, downloads: {}, home: {}, memo: '', received: '', downloaded: '' };
  const names = { 1.5: 'Message Forensics', 2.5: 'Witness Interviews', 3.5: 'Authentication Stress Test', 4.5: 'Malware Triage Lab', 4.75: 'Beyond the Investigation' };
  // Redrawing a choice should reveal feedback without sending the reader back to the page header.
  const originalDraw = draw;
  draw = function (html) {
    const retainScroll = window.__retainDecisionScroll === true;
    const previousY = window.scrollY;
    originalDraw(html);
    if (retainScroll) window.scrollTo(0, previousY);
    window.__retainDecisionScroll = false;
  };
  const originalPick = pick;
  pick = function (id, choice) { window.__retainDecisionScroll = true; originalPick(id, choice); };
  const originalAnswerQuiz = answerQuiz;
  answerQuiz = function (index, choice) { window.__retainDecisionScroll = true; originalAnswerQuiz(index, choice); };
  next = function () { step = route[Math.min(route.indexOf(step) + 1, route.length - 1)]; render(); };
  back = function () { step = route[Math.max(0, route.indexOf(step) - 1)]; render(); };
  render = function () { if (names[step]) extraScreen(step); else oldRender(); };

  function heading(title, body) {
    const current = route.indexOf(step);
    draw(`<section class="screen"><div class="tag">Case 01 / Extended Investigation · Stage ${current + 1} of ${route.length}</div><h2>${title}</h2><div class="progress">${route.map((_,i) => `<i class="${i <= current ? 'done' : ''}"></i>`).join('')}</div>${body}</section>`);
  }
  function navigation(allowed, label) {
    return `<div class="noprint" style="margin-top:25px"><button class="btn alt" onclick="back()">← Review previous</button><button class="btn" ${allowed ? '' : 'disabled'} onclick="next()">${label} →</button></div>`;
  }
  function label(text) { return `<div class="tag">${text}</div>`; }
  function decision(group, index, options, selected) {
    return options.map((o, j) => `<button class="choice ${selected === j ? 'selected' : ''}" onclick="expandedPick('${group}',${index},${j})"><b>${String.fromCharCode(65+j)}</b> · ${o}</button>`).join('');
  }
  window.expandedPick = function (group, i, j) { window.__retainDecisionScroll = true; extra[group][i] = j; render(); };
  function feedback(isRight, right, wrong) { return `<div class="note ${isRight ? 'good' : ''}">${isRight ? right : wrong}</div>`; }
  function selectedCount(group) { return Object.keys(extra[group]).length; }

  function extraScreen(which) {
    if (which === 1.5) messageLab();
    if (which === 2.5) witnessLab();
    if (which === 3.5) authLab();
    if (which === 4.5) malwareLab();
    if (which === 4.75) personalLab();
  }

  function messageLab() {
    const cards = [
      {from:'help@school-verify-support.net',subject:'Immediate account suspension',body:'Your account will be erased in 10 minutes. Click the link below to verify your account:<br><span class="simulated-link">https://school-login-check.example/verify</span>',options:['Trust: It mentions school security','Suspicious: The sender and requested login destination need independent verification','Safe: The address starts with help@'],correct:1,why:'This is a likely credential-phishing attempt. Attackers can mimic school branding, use urgent deadlines, and host convincing login pages.'},
      {from:'technology@school.example',subject:'Planned network maintenance',body:'School internet access may be interrupted Saturday, 6–8 AM. Details will be posted on the official school portal. No action is required.',options:['Definitely malicious: All technology emails are dangerous','Definitely authentic: The sender looks right','Might be legitimate; check the school portal if you need to confirm'],correct:2,why:'This message does not ask you to click a login link or take urgent action, so it has fewer warning signs. But the sender address alone does not prove it is real. If you are unsure, check the official school portal yourself.'},
      {from:'avery.chen@student.school.example',subject:'Here is the grade viewer!',body:'I found a program that lets you see your grades before they are posted. Here is the download link: fileshare.example/grade-viewer.exe',options:['Risky: Even a known sender may be using a compromised account','Safe: A classmate sent it','Safe if an antivirus icon appears next to the link'],correct:0,why:'A known account can be compromised. Unexpected installers and unofficial downloads should be avoided and reported to school IT.'}
    ];
    const emailCards = cards.map((c,i)=>`<div class="panel">${label('Evidence card 0'+(i+1))}<div class="mock-email"><div class="mail-chrome">✉ &nbsp; INBOX / RECEIVED MESSAGE</div><div class="mail-headers"><div class="mail-field"><span>FROM</span><strong>${c.from}</strong></div><div class="mail-field"><span>SUBJECT</span><strong>${c.subject}</strong></div></div><div class="mail-content">${c.body}</div></div><h3>How do you classify it?</h3>${decision('mail',i,c.options,extra.mail[i])}${extra.mail[i]!==undefined ? feedback(extra.mail[i]===c.correct,c.why,'Consider what this evidence proves. '+c.why) : ''}</div>`).join('');
    heading('Message Forensics', `<p class="muted">Investigators rarely get an email clearly labeled “scam.” Compare three messages and decide what can actually be concluded. Some have no definitive answer from the screenshot alone.</p><div class="evidence"><b>Training file: Three layers of an email</b><p><b>Identity:</b> Display names can be imitated; sender addresses may be spoofed. <b>Behavior:</b> Unexpected login requests, urgent threats and attachments are warning signs. <b>Verification:</b> The safest next step is often to use a separate, trusted route to the organization.</p><p><b>Important:</b> HTTPS encrypts a connection but does not prove the website is trustworthy. No link in this simulation is live.</p></div>${emailCards}<div class="panel"><h3>Field note</h3><p>An email includes the school's official logo. Why doesn't that prove the message is really from the school? Discuss with your partner and explain how you could verify an account warning.</p><p class="muted">You should be able to explain this aloud before leaving the lab.</p></div>${navigation(selectedCount('mail')===3,'Compare witness evidence')}`);
  }

  function witnessLab() {
    const rows = [
      {claim:'Sam: “The attacker was definitely overseas. That’s why the school missed them.”',options:['Confirmed by the login log','Possible, but not proven by the evidence','Disproved by the email'],correct:1,why:'An unfamiliar device does not establish a physical location. Even location information can be inaccurate or affected by intermediaries.'},
      {claim:'Taylor (IT): “Someone entered Avery’s password on a lookalike site before the unfamiliar login.”',options:['Directly supported by the available record','Pure speculation','Proof that Avery intentionally attacked classmates'],correct:0,why:'The timeline records credential entry before the unfamiliar login. That supports a phishing hypothesis but not the identity or intentions of the later user.'},
      {claim:'Morgan: “Every kid who got that email should wipe their computer immediately.”',options:['Good advice because everyone who receives the message is infected','Not justified: receiving a suspicious message does not prove infection, and students should follow IT guidance','Proof that the recipients already removed the malware'],correct:1,why:'Receiving a malicious link is not the same as downloading or running malware. Wiping a device without evidence or IT guidance is an extreme response.'}
    ];
    heading('Witness Interviews', `<p class="muted">Several people have offered explanations and advice about the breach. Compare their exact statements with what the records show.</p><div class="panel"><h3>Interview transcript</h3><p><b>Avery:</b> “I signed in after the warning because it looked official. I didn’t send anything to my class.”</p><p><b>Sam:</b> “The attacker was definitely overseas. That’s why the school missed them.”</p><p><b>Taylor (IT):</b> “Someone entered Avery’s password on a lookalike site before the unfamiliar login.”</p><p><b>Morgan:</b> “Every kid who got that email should wipe their computer immediately.”</p><div class="evidence"><b>Analyst lesson: evidence has limits</b><p>An investigator can say <em>the record supports</em> a scenario without asserting certainty. Logs reveal events, not always motives or identities. Extra claims require extra evidence.</p></div></div>${rows.map((r,i)=>`<div class="panel">${label('Statement '+(i+1))}<h3>${r.claim}</h3>${decision('witness',i,r.options,extra.witness[i])}${extra.witness[i]!==undefined ? feedback(extra.witness[i]===r.correct,r.why,'Revisit the difference between an observation and a conclusion. '+r.why) : ''}</div>`).join('')}<div class="panel"><h3>Partner challenge</h3><p>The suspicious message was sent from Avery's account. Does that prove Avery personally sent it? With your partner, identify two clues suggesting someone else might have used the account. Then name one additional piece of evidence investigators could look for.</p></div>${navigation(selectedCount('witness')===3,'Investigate authentication')}`);
  }

  function authLab() {
    const prompts = [
      {title:'Unexpected approval notification',body:'Avery receives five MFA approval prompts on a phone while sitting in class. Avery has not attempted to sign in.',options:['Ignore the requests because nobody can enter without approval','Deny the requests, report them, and review account security','Change the password and assume no further action is needed'],correct:1,why:'Repeated unsolicited approval prompts can be an MFA-fatigue attack. Deny them, report them, and secure the account using trusted support.'},
      {title:'Backup account recovery',body:'After changing the password, Avery realizes their backup codes were saved in an unprotected shared document.',options:['Move the same codes to another document without replacing them','Change the account password again but leave the codes unchanged','Replace compromised codes and store new ones securely'],correct:2,why:'Backup codes can grant account access. Store them privately and securely, such as in an approved password manager or another protected location.'},
      {title:'A student proposes a rule',body:'“Everyone should change their password every Friday, even when there is no sign of compromise.”',options:['A universal weekly change rule is the best defense','Long unique passwords, MFA and changing passwords when compromised are generally more valuable','Passwords do not matter after MFA'],correct:1,why:'Frequent forced changes can encourage predictable patterns. Strong unique credentials and MFA are generally preferable, with prompt changes after a suspected compromise.'}
    ];
    heading('Authentication Stress Test', `<p class="muted">The account is being recovered, but the attacker may still have access to other routes. Decide what to do when common security advice conflicts with realistic situations.</p><div class="evidence"><b>Field guide: Authentication methods</b><p><b>Password:</b> Something you know. <b>Authenticator or device:</b> Something you have. <b>Biometric:</b> Something you are. MFA uses independent factors. A passkey can use cryptography tied to the legitimate site, helping resist phishing. Recovery methods must also be protected.</p><p>A password manager helps create and store unique credentials, but its own vault needs careful protection. No single technique eliminates all threats.</p></div>${prompts.map((p,i)=>`<div class="panel">${label('Security simulation '+(i+1))}<h3>${p.title}</h3><p>${p.body}</p>${decision('auth',i,p.options,extra.auth[i])}${extra.auth[i]!==undefined ? feedback(extra.auth[i]===p.correct,p.why,'That could create a new weakness. '+p.why) : ''}</div>`).join('')}<div class="panel"><h3>Discuss with your partner</h3><p>Avery received five MFA approval requests without trying to sign in. What was the attacker hoping Avery would do? How could that action let the attacker into the account?</p></div>${navigation(selectedCount('auth')===3,'Analyze suspicious files')}`);
  }

  function malwareLab() {
    const artifacts = [
      {name:'Attachment: grade_viewer_update.exe',desc:'An unsolicited email claims this program reveals grades before they are released.',options:['Scan it first, then run it if no warning appears','Treat as suspicious, avoid running, and report it','Ask the sender whether they meant to send it, then install if they say yes'],correct:1,why:'A scan with no warning cannot guarantee that an unapproved installer is safe. The executable is unexpected and unrelated to an authorized school software source.'},
      {name:'Operating system update',desc:'An update notification appears inside the device’s built-in Settings app, managed by the school.',options:['Follow school IT’s approved update process','Download a substitute patch from a message board','Disable updates permanently'],correct:0,why:'Trusted updates fix known vulnerabilities. School-managed devices may require IT approval or scheduling.'},
      {name:'Security software alert',desc:'The school-approved protection tool flags a suspicious file, but no execution is recorded.',options:['Declare all accounts permanently compromised','Ignore the alert because no infection is proven','Quarantine or report per school policy and let IT verify the result'],correct:2,why:'An alert warrants investigation. Detection tools sometimes produce false positives, and the appropriate response depends on validated evidence and school procedures.'}
    ];
    const advisoryForm = `<div class="panel"><h3>Write the IT advisory</h3><p>Use what you learned to write two short pieces of advice for classmates. Each should be one or two sentences.</p><div class="evidence"><b>Part 1: Students who only received the message</b><p>Tell them what to do with the suspicious link and how to report the message. They haven't clicked anything.</p></div><textarea id="adviceReceived" maxlength="500" placeholder="If you only received the message, ...">${esc(extra.received)}</textarea><div class="evidence"><b>Part 2: Students who downloaded or ran the file</b><p>Explain what they should avoid doing next and who they should contact for help. Don't assume every device is infected.</p></div><textarea id="adviceDownloaded" maxlength="500" placeholder="If you downloaded or ran the file, ...">${esc(extra.downloaded)}</textarea><p class="muted">Write at least 35 characters for each part. Both will appear in your final case report.</p><button class="btn alt" onclick="expandedSaveMemo()">Save advisory</button><span id="memoSaved" class="muted">${extra.memo?'Advisory saved.':'Not yet saved.'}</span></div>`;
    const fieldGuide = `<div class="evidence"><b>Field guide: Recognizing and responding to malware risks</b><p><b>Malware</b> is software designed to cause harm, steal information, or gain unauthorized access. A virus is one type of malware. Not every suspicious link or security alert means a device is infected.</p><ul><li><b>When a suspicious message arrives:</b> Avoid opening or forwarding unfamiliar links and attachments. Use a trusted reporting method.</li><li><b>When a file has been downloaded:</b> Having a file saved is not the same as running it. Avoid launching an unexpected program.</li><li><b>When a suspicious program may have run:</b> Stop experimenting with it. The next steps may include a security scan, isolating the device, or recovering files and accounts.</li><li><b>Everyday prevention:</b> Keep the operating system and security tools updated. Install software from trusted, authorized sources.</li></ul><p><b>Where to get help matters:</b> On a school-managed device, contact school IT and follow its procedures. On a personal device, use the device's built-in or other reputable security tools, official support resources, or a trusted adult or qualified technician if you need help. Avoid random “fix your computer” pop-ups.</p><p><b>Remember:</b> Receiving a message, downloading a file, running software, and confirming an infection are different events. Good advice depends on what actually happened.</p></div>`;
    heading('Malware Triage Lab', `<p class="muted">You now have to triage three artifacts. Not every alert proves a computer is infected, and not every legitimate-looking download is safe.</p>${fieldGuide}${artifacts.map((a,i)=>`<div class="panel">${label('Artifact '+(i+1))}<h3>${a.name}</h3><p>${a.desc}</p>${decision('downloads',i,a.options,extra.downloads[i])}${extra.downloads[i]!==undefined ? feedback(extra.downloads[i]===a.correct,a.why,'Check which action reduces risk without inventing facts. '+a.why) : ''}</div>`).join('')}${advisoryForm}${navigation(selectedCount('downloads')===3&&extra.memo.length>0,'Apply this at home')}`);
  }

  function personalLab() {
    const situations = [
      {title:'The strange pop-ups',body:'You installed a free game mod from an unfamiliar website. Soon afterward, unusual pop-ups appear and the browser behaves strangely. What should you do first?',options:['Click the pop-up offering an instant cleaning tool','Stop using the suspicious program, avoid entering sensitive information, and assess the problem safely','Keep using the laptop until you are certain it has malware'],correct:1,why:'Unexpected behavior is a warning sign, not proof of infection. Stop interacting with the suspicious software and avoid exposing account information while you investigate.'},
      {title:'Choosing a security tool',body:'You want to check your personal laptop. Which approach is the safest starting point?',options:['Use the operating system’s built-in security tools or a reputable product obtained from an official source','Choose a tool with many positive comments in an unfamiliar download forum','Use whichever cleaner a search advertisement recommends first'],correct:0,why:'Use built-in or well-established security tools and official support information. Ads and anonymous recommendations do not establish that a tool is trustworthy.'},
      {title:'Protecting your accounts',body:'You entered your gaming-account password on the laptop after the suspicious program ran. What is a sensible precaution?',options:['Reuse that password for other accounts so it is easier to remember','Assume the password is safe because the laptop still turns on','From a device you trust, change the potentially exposed password, check account sessions, and enable MFA if available'],correct:2,why:'If credentials may have been exposed, secure the account from a trusted device. Unique passwords and MFA can reduce the chance of further unauthorized access.'},
      {title:'When you need more help',body:'The warnings keep returning, and you are not sure whether the problem is resolved. What now?',options:['Use official device support or ask a trusted adult or qualified technician for help','Follow random instructions that tell you to turn off security features','Delete all your files immediately without checking anything'],correct:0,why:'If you cannot confidently resolve a possible compromise, get trustworthy assistance. Avoid random repair offers or drastic actions without understanding the consequences.'}
    ];
    heading('Beyond the Investigation', `<p class="muted">Now imagine this happened on your own laptop at home. There is no school IT department managing it. Work through four decisions you might have to make yourself.</p><div class="evidence"><b>Home security reminder</b><p>You can take practical first steps: stop interacting with suspicious software, use trusted device security features, protect potentially exposed accounts, and seek reliable help when needed. The right response depends on what you actually observed.</p></div>${situations.map((s,i)=>`<div class="panel">${label('At-home decision '+(i+1))}<h3>${s.title}</h3><p>${s.body}</p>${decision('home',i,s.options,extra.home[i])}${extra.home[i]!==undefined?feedback(extra.home[i]===s.correct,s.why,'Consider which option reduces risk without making things worse. '+s.why):''}</div>`).join('')}<div class="panel"><h3>Partner reflection</h3><p>Which part of this response would change if the laptop belonged to your school instead of you? Explain who would be responsible for investigating the device.</p></div>${navigation(selectedCount('home')===4,'Complete case verdict')}`);
  }

  window.expandedSaveMemo = function () {
    const received = document.getElementById('adviceReceived').value.trim();
    const downloaded = document.getElementById('adviceDownloaded').value.trim();
    if (received.length < 35 || downloaded.length < 35) { alert('Write at least 35 characters for each situation.'); return; }
    extra.received = received;
    extra.downloaded = downloaded;
    extra.memo = 'If they only received the message: ' + received + '\nIf they downloaded or ran the file: ' + downloaded;
    window.__retainDecisionScroll = true;
    render();
  };

  // Include the new student's written work in the printable investigation report.
  const baseFinish = finish;
  finish = function () {
    baseFinish();
    if (step === 7 && extra.memo) {
      const report = document.querySelector('.report');
      if (report) report.insertAdjacentHTML('beforeend', `<h3>Student advisory to recipients</h3><p style="white-space:pre-line">${esc(extra.memo)}</p><h3>Beyond the Investigation</h3><p>Personal-device application: ${selectedCount('home')} of 4 situations completed.</p>`);
    }
  };
  window.getDigitalDecisionsExtras = function () {
    return { memo: extra.memo, received: extra.received, downloaded: extra.downloaded, homeComplete: selectedCount('home'), state: JSON.parse(JSON.stringify(extra)) };
  };
  window.setDigitalDecisionsExtras = function (saved) {
    if (!saved || typeof saved !== 'object') return;
    for (const group of ['mail','witness','auth','downloads','home']) {
      if (saved[group] && typeof saved[group] === 'object') extra[group] = { ...saved[group] };
    }
    for (const field of ['memo','received','downloaded']) {
      if (typeof saved[field] === 'string') extra[field] = saved[field];
    }
  };
})();
