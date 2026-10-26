// Creates a simple, self-contained PDF in the student's browser. No report data is uploaded.
(function () {
  function printable(value) {
    return String(value == null ? '' : value)
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2022/g, '-')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E\n]/g, '');
  }

  function pdfEscape(text) {
    return printable(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  function wrap(text, limit) {
    const result = [];
    for (const paragraph of printable(text).split('\n')) {
      if (!paragraph.trim()) { result.push(''); continue; }
      let line = '';
      for (const word of paragraph.split(/\s+/)) {
        if (!word) continue;
        if (line && (line + ' ' + word).length > limit) {
          result.push(line);
          line = '';
        }
        if (word.length > limit) {
          if (line) { result.push(line); line = ''; }
          for (let i = 0; i < word.length; i += limit) {
            const piece = word.slice(i, i + limit);
            if (piece.length === limit) result.push(piece);
            else line = piece;
          }
        } else line = line ? line + ' ' + word : word;
      }
      if (line) result.push(line);
    }
    return result;
  }

  function buildPdf(report) {
    const pages = [];
    let operations = [];
    let y = 745;
    const newPage = () => { if (operations.length) pages.push(operations.join('\n')); operations = []; y = 745; };
    function line(text, size = 10, bold = false, indent = 0) {
      if (y < 58) newPage();
      operations.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${48 + indent} ${y} Td (${pdfEscape(text)}) Tj ET`);
      y -= size >= 16 ? 25 : size >= 12 ? 19 : 15;
    }
    function heading(text) {
      if (y < 100) newPage();
      y -= 7;
      line(text, 12, true);
      y -= 3;
    }
    function paragraph(text) {
      for (const wrapped of wrap(text, 92)) {
        if (wrapped) line(wrapped);
        else y -= 9;
      }
      y -= 7;
    }

    line('DIGITAL DECISIONS', 19, true);
    line('Case 01 - Account Compromised | Investigation Report', 12, true);
    y -= 12;
    paragraph('Investigators: ' + (report.team || 'Not supplied'));
    paragraph('Completion code: ' + report.code + '    Knowledge check: ' + report.score + ' / 6');
    heading('Case Verdict');
    paragraph(report.verdict);
    heading('Investigation Decisions');
    report.decisions.forEach(item => paragraph(item));
    heading('Evidence-Based Explanation');
    paragraph(report.reason || 'No explanation submitted.');
    heading('Advisory: Message Received, Not Opened');
    paragraph(report.received || 'No advisory submitted.');
    heading('Advisory: File Downloaded or Run');
    paragraph(report.downloaded || 'No advisory submitted.');
    heading('Personal Device Application');
    paragraph(report.homeComplete + ' of 4 personal-device situations completed.');
    heading('Knowledge Check and Feedback');
    report.review.forEach((r, i) => {
      paragraph((i + 1) + '. ' + r.question);
      paragraph('Student answer: ' + r.answer + (r.correct ? ' [Correct]' : ' [Incorrect]'));
      paragraph('Explanation: ' + r.explanation);
    });
    heading('Submission Note');
    paragraph('This report records answers from this browser session. Completion codes are not secure proof of identity; the teacher may verify responses separately.');
    newPage();

    const objects = [null];
    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
    objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
    const kids = [];
    pages.forEach((content, index) => {
      const streamId = 5 + index * 2;
      const pageId = streamId + 1;
      kids.push(pageId + ' 0 R');
      objects[streamId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
      objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamId} 0 R >>`;
    });
    objects[2] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>`;
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (let i = 1; i < objects.length; i++) {
      offsets[i] = pdf.length;
      pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
    }
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let i = 1; i < objects.length; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return pdf;
  }

  function caseReport() {
    const extra = typeof window.getDigitalDecisionsExtras === 'function' ? window.getDigitalDecisionsExtras() : {};
    const classwork = typeof window.getDigitalDecisionsEnhancements === 'function' ? window.getDigitalDecisionsEnhancements() : {};
    const verdicts = [
      'No account breach investigation needed',
      'Likely credential phishing and account misuse; investigate and contain',
      'All recipients are infected'
    ];
    return {
      team,
      code: completion(),
      score: quizScore,
      verdict: verdicts[answers.verdict] || 'Not selected',
      decisions: [
        'Suspicious email response: ' + (['Clicked email link', 'Used trusted independent school contact', 'Replied with password'][answers.email] || 'Unanswered'),
        'Timeline: ' + ((classwork.timeline || []).join(',') === '0,1,2,3' ? 'All four events ordered correctly' : 'Timeline not verified'),
        'Account compromise conclusion: ' + (['Avery intentionally sent messages', 'Likely credential phishing and misuse', 'All recipients infected'][answers.timeline] || 'Unanswered'),
        'Password choice: ' + (['Predictable repeated password', 'Predictable substitutions', 'Long unique passphrase'][answers.password] || 'Unanswered'),
        'Authentication: ' + (['Password alone is enough', 'A second factor is required', 'No alert for correct password'][answers.mfa] || 'Unanswered'),
        'Suspicious link response: ' + (['Ask classmate to verify link', 'Leave unopened and report', 'Forward to group chat'][answers.malware] || 'Unanswered'),
        'Account recovery: ' + (['Secure account and end unfamiliar sessions', 'Change password only', 'Delete message and wait'][answers.recovery] || 'Unanswered'),
        'Extra investigations completed: ' + ['mail','witness','auth','downloads','home'].map(group => group + ' ' + Object.keys((extra.state || {})[group] || {}).length).join('; ')
      ],
      reason: verdictText,
      received: extra.received || '',
      downloaded: extra.downloaded || '',
      homeComplete: extra.homeComplete || 0,
      review: qs.map((q, i) => ({
        question: q[0],
        answer: q[1][quiz[i]] || 'Unanswered',
        correct: quiz[i] === q[2],
        explanation: q[3]
      }))
    };
  }

  window.downloadCasePdf = function () {
    try {
      const pdf = buildPdf(caseReport());
      const blob = new Blob([pdf], {type: 'application/pdf'});
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const names = (team || 'Investigators').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 72);
      anchor.download = 'DigitalDecisions_Case01_' + names + '.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      alert('The PDF could not be generated in this browser. Try opening the game in a regular browser tab, or use Print and choose Save as PDF.');
    }
  };

  // Upgrade the old print-only control when the completion screen is rendered.
  const previousRender = render;
  render = function () {
    previousRender();
    if (step !== 7) return;
    const controls = document.querySelector('.screen .noprint');
    if (!controls) return;
    const originalButton = controls.querySelector('button');
    if (!originalButton) return;
    originalButton.textContent = 'Download PDF report';
    originalButton.setAttribute('onclick', 'downloadCasePdf()');
    if (!controls.querySelector('#printCaseFallback')) {
      const printButton = document.createElement('button');
      printButton.id = 'printCaseFallback';
      printButton.className = 'btn alt';
      printButton.textContent = 'Print report';
      printButton.onclick = () => window.print();
      originalButton.after(printButton);
      const help = document.createElement('p');
      help.className = 'muted';
      help.textContent = 'Download the PDF and submit it using your teacher\'s usual assignment system.';
      controls.appendChild(help);
    }
  };

  // Exposed only for local correctness checks; it does not collect or transmit data.
  window.makeDigitalDecisionsPdf = buildPdf;
})();
