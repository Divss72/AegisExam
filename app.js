/**
 * AEGISEXAM SENTINEL 2.0 • CORE FULL-STACK CLIENT ENGINE
 * LeetCode Coding Environment, Question Studio, Real-Time Proctoring Telemetry,
 * Dynamic Watermarking & Forensic Leak Tracer Laboratory
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  const state = {
    currentUser: {
      id: 1,
      role: 'admin',
      fullName: 'Dr. Eleanor Vance',
      studentId: null,
      email: 'admin@aegisexam.io'
    },
    token: null,
    currentTab: 'view-studio',
    questions: [],
    selectedStudioQuestionId: 3,
    activeExam: null,
    activeExamSession: null,
    currentExamQuestionIndex: 0,
    studentAnswers: {}, // { [questionId]: { code, language, answer } }
    monacoEditor: null,
    socket: null,
    watermark: {
      studentName: 'Sarah Jenkins',
      studentId: 'MIT-2026-CS8891',
      examId: 'EXAM-FINAL-OCT26',
      ipAddress: '192.168.1.142',
      sessionToken: '9F8A2C1D',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      strategy: 'canvas-bake',
      opacity: 0.18,
      angle: -28
    },
    holdToRevealActive: false,
    spotlightPos: { x: 400, y: 250 },
    proctoring: {
      armed: true,
      violations: 0,
      isBlackedOut: false,
      examTimeRemaining: 44 * 60 + 59,
      timerInterval: null
    },
    tracerMode: 'phone', // 'phone' | 'screenshot' | 'glare'
    tracerFilter: 'raw' // 'raw' | 'contrast' | 'invert' | 'dots'
  };

  // ==========================================================================
  // DOM ELEMENT REFERENCES
  // ==========================================================================
  const navTabs = document.querySelectorAll('.nav-tab');
  const viewPanels = document.querySelectorAll('.view-panel');
  const previewCanvas = document.getElementById('preview-canvas');
  const studentCanvas = document.getElementById('student-exam-canvas');
  const tracerCanvas = document.getElementById('tracer-sample-canvas');
  const previewDomWrapper = document.getElementById('preview-dom-wrapper');
  const previewDomContent = document.getElementById('preview-dom-content');
  const previewDomWatermark = document.getElementById('preview-dom-watermark');
  const previewModeTag = document.getElementById('preview-mode-tag');
  const previewClock = document.getElementById('preview-clock');
  const forensicPayloadDisplay = document.getElementById('forensic-payload-display');

  // Role Switcher Elements
  const btnRoleMenu = document.getElementById('btn-role-menu');
  const roleDropdown = document.getElementById('role-dropdown');
  const headerRoleBadge = document.getElementById('header-role-badge');
  const headerUserName = document.getElementById('header-user-name');
  const roleMenuItems = document.querySelectorAll('.role-menu-item');

  // Studio Form Elements
  const studioQuestionSelector = document.getElementById('studio-question-selector');
  const btnNewQuestion = document.getElementById('btn-new-question');
  const btnDuplicateQuestion = document.getElementById('btn-duplicate-question');
  const qTypeSelect = document.getElementById('q-type');
  const qDifficultySelect = document.getElementById('q-difficulty');
  const qSubjectInput = document.getElementById('q-subject');
  const qModuleInput = document.getElementById('q-module');
  const qMarksInput = document.getElementById('q-marks');
  const qNegativeMarksInput = document.getElementById('q-negative-marks');
  const qTitleInput = document.getElementById('q-title');
  const qBodyInput = document.getElementById('q-body');
  const mcqOptionsGroup = document.getElementById('mcq-options-builder-group');
  const codingTestCasesGroup = document.getElementById('coding-testcases-builder-group');
  const testCasesListContainer = document.getElementById('testcases-list-container');
  const btnAddTestCase = document.getElementById('btn-add-testcase');
  const btnSaveQuestionDb = document.getElementById('btn-save-question-db');

  // Watermark Form Elements
  const wmNameInput = document.getElementById('wm-student-name');
  const wmIdInput = document.getElementById('wm-student-id');
  const wmExamInput = document.getElementById('wm-exam-id');
  const wmIpInput = document.getElementById('wm-ip-address');
  const wmStrategyRadios = document.querySelectorAll('input[name="wm-strategy"]');
  const wmOpacityRange = document.getElementById('wm-opacity');
  const wmOpacityVal = document.getElementById('wm-opacity-val');
  const wmAngleRange = document.getElementById('wm-angle');
  const wmAngleVal = document.getElementById('wm-angle-val');
  const btnLaunchExam = document.getElementById('btn-launch-exam');
  const btnDownloadPreview = document.getElementById('btn-download-preview');

  // Student Exam Elements
  const examTimerDisplay = document.getElementById('exam-timer');
  const hudCandidateInfo = document.getElementById('hud-candidate-info');
  const violationCountDisplay = document.getElementById('violation-count');
  const socketStatusBadge = document.getElementById('socket-status-badge');
  const examQNavPalette = document.getElementById('exam-q-nav-palette');
  const studentTargetedShield = document.getElementById('student-targeted-shield');
  const studioTargetedShield = document.getElementById('studio-targeted-shield');
  const btnUnlockQuestion = document.getElementById('btn-unlock-question');
  const btnUnlockStudio = document.getElementById('btn-unlock-studio');
  const studentQTitle = document.getElementById('student-q-title');
  const studentQDiff = document.getElementById('student-q-diff');
  const studentQType = document.getElementById('student-q-type');
  const studentQPoints = document.getElementById('student-q-points');
  const studentQBody = document.getElementById('student-q-body');
  const examAutosaveStatus = document.getElementById('exam-autosave-status');

  // Code Workspace & Test Runner Elements
  const codingWorkspaceWrapper = document.getElementById('coding-workspace-wrapper');
  const mcqWorkspaceWrapper = document.getElementById('mcq-workspace-wrapper');
  const descriptiveWorkspaceWrapper = document.getElementById('descriptive-workspace-wrapper');
  const editorLangSelect = document.getElementById('editor-lang-select');
  const editorThemeSelect = document.getElementById('editor-theme-select');
  const btnResetCode = document.getElementById('btn-reset-code');
  const btnRunTests = document.getElementById('btn-run-tests');
  const btnSubmitSolution = document.getElementById('btn-submit-solution');
  const testcaseTabBar = document.getElementById('testcase-tab-bar');
  const testcaseDrawerBody = document.getElementById('testcase-drawer-body');
  const testExecTime = document.getElementById('test-exec-time');
  const codeFallbackEditor = document.getElementById('code-fallback-editor');
  const editorWatermarkOverlay = document.getElementById('editor-watermark-overlay');
  const studentMcqOptionsContainer = document.getElementById('student-mcq-options-container');
  const descriptiveAnswerInput = document.getElementById('descriptive-answer-input');
  const descriptiveWordCount = document.getElementById('descriptive-word-count');

  // Simulation Controls & Submissions
  const btnSimulateSnipping = document.getElementById('btn-simulate-snipping');
  const btnSimulatePrintscreen = document.getElementById('btn-simulate-printscreen');
  const btnSubmitExamHud = document.getElementById('btn-submit-exam-hud');

  // Modals & Toasts
  const toast = document.getElementById('violation-toast');
  const toastTitle = document.getElementById('toast-title');
  const toastMessage = document.getElementById('toast-message');
  const invigilatorWarningModal = document.getElementById('invigilator-warning-modal');
  const invigilatorModalMsg = document.getElementById('invigilator-modal-msg');
  const btnAckWarning = document.getElementById('btn-ack-warning');
  const examSubmitModal = document.getElementById('exam-submit-modal');
  const btnCancelSubmit = document.getElementById('btn-cancel-submit');
  const btnConfirmSubmit = document.getElementById('btn-confirm-submit');
  const modalCompletedCount = document.getElementById('modal-completed-count');
  const modalTimeLeft = document.getElementById('modal-time-left');
  const modalViolationCount = document.getElementById('modal-violation-count');

  // Invigilator Center Elements
  const candidateRosterTbody = document.getElementById('candidate-roster-tbody');
  const invigilatorLogStream = document.getElementById('invigilator-log-stream');
  const btnRefreshRoster = document.getElementById('btn-refresh-roster');

  // Tracer Elements
  const btnLeakPhone = document.getElementById('btn-leak-phone');
  const btnLeakScreenshot = document.getElementById('btn-leak-screenshot');
  const btnLeakGlare = document.getElementById('btn-leak-glare');
  const filterBtnRaw = document.getElementById('filter-btn-raw');
  const filterBtnContrast = document.getElementById('filter-btn-contrast');
  const filterBtnInvert = document.getElementById('filter-btn-invert');
  const filterBtnDots = document.getElementById('filter-btn-dots');
  const btnRunForensicScan = document.getElementById('btn-run-forensic-scan');
  const tracerResultsBox = document.getElementById('tracer-results-box');

  // ==========================================================================
  // INITIALIZATION & SOCKET.IO SETUP
  // ==========================================================================
  async function initializeApplication() {
    initSocketIO();
    initMonacoEditor();
    await loadQuestionsFromDatabase();
    await loadActiveExam();
    updateWatermarkPayloadText();
    renderAllCanvases();
    renderTracerSample();
    startExamTimer();
    setupEventListeners();
  }

  function initSocketIO() {
    try {
      if (typeof io !== 'undefined') {
        state.socket = io();

        state.socket.on('connect', () => {
          if (socketStatusBadge) {
            socketStatusBadge.innerHTML = `<span style="width:7px; height:7px; border-radius:50%; background:#10b981;"></span> Socket: Connected`;
          }
          state.socket.emit('join:invigilators');
          if (state.activeExamSession) {
            state.socket.emit('join:session', state.activeExamSession.id);
          }
        });

        // Invigilator receives real-time violations from candidates
        state.socket.on('proctor:violation', (violation) => {
          appendInvigilatorLog(violation);
          if (state.currentTab === 'view-invigilator') {
            refreshCandidateRoster();
          }
        });

        // Student receives real-time notices from invigilator
        state.socket.on('proctor:action', (action) => {
          if (action.actionType === 'warning') {
            invigilatorModalMsg.textContent = action.message;
            invigilatorWarningModal.classList.remove('hidden');
          } else if (action.actionType === 'lock') {
            triggerTargetedBlackout('Exam session locked remotely by invigilator.');
          }
        });

        state.socket.on('disconnect', () => {
          if (socketStatusBadge) {
            socketStatusBadge.innerHTML = `<span style="width:7px; height:7px; border-radius:50%; background:#f59e0b;"></span> Socket: Reconnecting...`;
          }
        });
      }
    } catch (err) {
      console.warn('Socket.io client initialization skipped:', err);
    }
  }

  // ==========================================================================
  // MONACO CODE EDITOR INTEGRATION
  // ==========================================================================
  function initMonacoEditor() {
    if (typeof require !== 'undefined' && require.config) {
      require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
      require(['vs/editor/editor.main'], () => {
        const container = document.getElementById('monaco-editor-container');
        if (!container) return;

        state.monacoEditor = monaco.editor.create(container, {
          value: getDefaultStarterCode('javascript'),
          language: 'javascript',
          theme: 'vs-dark',
          fontSize: 13,
          fontFamily: "'JetBrains Mono', Consolas, monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 12, bottom: 12 }
        });

        state.monacoEditor.onDidChangeModelContent(() => {
          const currentQ = getCurrentExamQuestion();
          if (currentQ) {
            if (!state.studentAnswers[currentQ.id]) state.studentAnswers[currentQ.id] = {};
            state.studentAnswers[currentQ.id].code = state.monacoEditor.getValue();
            state.studentAnswers[currentQ.id].language = editorLangSelect.value;
          }
        });

        // Sync editor watermark overlay text
        updateEditorWatermarkOverlay();
      });
    } else {
      // Graceful fallback to textarea
      codeFallbackEditor.classList.remove('hidden');
      codeFallbackEditor.value = getDefaultStarterCode('javascript');
      codeFallbackEditor.addEventListener('input', () => {
        const currentQ = getCurrentExamQuestion();
        if (currentQ) {
          if (!state.studentAnswers[currentQ.id]) state.studentAnswers[currentQ.id] = {};
          state.studentAnswers[currentQ.id].code = codeFallbackEditor.value;
        }
      });
    }
  }

  function getEditorCode() {
    if (state.monacoEditor) {
      return state.monacoEditor.getValue();
    }
    return codeFallbackEditor.value;
  }

  function setEditorCode(code, lang = 'javascript') {
    if (state.monacoEditor) {
      state.monacoEditor.setValue(code);
      monaco.editor.setModelLanguage(state.monacoEditor.getModel(), lang);
    } else {
      codeFallbackEditor.value = code;
    }
    updateEditorWatermarkOverlay();
  }

  function updateEditorWatermarkOverlay() {
    if (!editorWatermarkOverlay) return;
    editorWatermarkOverlay.innerHTML = '';
    const wm = state.watermark;
    const tileText = `${wm.studentName.toUpperCase()} • ${wm.studentId} • ${wm.sessionToken}`;
    for (let i = 0; i < 20; i++) {
      const tile = document.createElement('div');
      tile.className = 'wm-tile-text';
      tile.style.color = `rgba(255, 255, 255, ${wm.opacity})`;
      tile.textContent = tileText;
      editorWatermarkOverlay.appendChild(tile);
    }
  }

  // ==========================================================================
  // QUESTION STUDIO & DATABASE OPERATIONS
  // ==========================================================================
  async function loadQuestionsFromDatabase() {
    try {
      const res = await fetch('/api/questions');
      const data = await res.json();
      if (data.questions) {
        state.questions = data.questions;
        populateStudioQuestionSelector();
      }
    } catch (err) {
      console.warn('Failed to load questions from backend:', err);
    }
  }

  function populateStudioQuestionSelector() {
    studioQuestionSelector.innerHTML = '';
    state.questions.forEach((q, idx) => {
      const opt = document.createElement('option');
      opt.value = q.id;
      opt.textContent = `Q${idx + 1}: ${q.title} [${q.type.toUpperCase()} • ${q.difficulty.toUpperCase()} • ${q.marks} pts]`;
      if (q.id === state.selectedStudioQuestionId) opt.selected = true;
      studioQuestionSelector.appendChild(opt);
    });

    // Populate the form with the selected question
    loadQuestionIntoStudioForm(state.selectedStudioQuestionId);
  }

  function loadQuestionIntoStudioForm(questionId) {
    const q = state.questions.find(item => item.id == questionId) || state.questions[0];
    if (!q) return;

    state.selectedStudioQuestionId = q.id;
    qTitleInput.value = q.title;
    qSubjectInput.value = q.subject;
    qModuleInput.value = q.module || '';
    qTypeSelect.value = q.type;
    qDifficultySelect.value = q.difficulty;
    qMarksInput.value = q.marks;
    qNegativeMarksInput.value = q.negativeMarks || 0;
    qBodyInput.value = q.problemStatement;

    toggleQuestionTypeFields(q.type);

    if (q.type === 'mcq' && q.options) {
      renderMcqOptionsInStudio(q.options, q.correctAnswer);
    } else if (q.type === 'coding' && q.sampleTestCases) {
      renderCodingTestCasesInStudio(q.sampleTestCases, q.privateTestCases || []);
    }

    renderAllCanvases();
  }

  function toggleQuestionTypeFields(type) {
    if (type === 'mcq') {
      mcqOptionsGroup.classList.remove('hidden');
      codingTestCasesGroup.classList.add('hidden');
    } else if (type === 'coding') {
      mcqOptionsGroup.classList.add('hidden');
      codingTestCasesGroup.classList.remove('hidden');
    } else {
      mcqOptionsGroup.classList.add('hidden');
      codingTestCasesGroup.classList.add('hidden');
    }
  }

  function renderMcqOptionsInStudio(options, correctAnswer) {
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D', 'E'];

    const optsArr = Array.isArray(options) ? options : [];
    optsArr.forEach((optText, idx) => {
      const row = document.createElement('div');
      row.className = 'option-row';
      const isCorrect = correctAnswer && optText.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
      row.innerHTML = `
        <input type="radio" name="correct-opt-radio" ${isCorrect ? 'checked' : ''} title="Mark as Correct Answer">
        <span class="option-label">${letters[idx] || idx + 1}</span>
        <input type="text" class="input-control opt-input" value="${escapeHTML(optText)}">
      `;
      container.appendChild(row);
    });
  }

  function renderCodingTestCasesInStudio(sampleTests, privateTests) {
    testCasesListContainer.innerHTML = '';
    const allTests = [
      ...(Array.isArray(sampleTests) ? sampleTests.map(t => ({ ...t, isPrivate: false })) : []),
      ...(Array.isArray(privateTests) ? privateTests.map(t => ({ ...t, isPrivate: true })) : [])
    ];

    allTests.forEach((tc, idx) => {
      const row = document.createElement('div');
      row.style.cssText = 'background:#0a0e18; border:1px solid var(--border-subtle); border-radius:6px; padding:10px; display:flex; gap:10px; align-items:center;';
      row.innerHTML = `
        <span style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">#${idx + 1}</span>
        <input type="text" class="input-control tc-input-field" placeholder="Input (e.g. [2,7,11,15], 9)" value="${escapeHTML(typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input))}" style="flex:2;">
        <input type="text" class="input-control tc-output-field" placeholder="Expected Output" value="${escapeHTML(typeof tc.expectedOutput === 'string' ? tc.expectedOutput : JSON.stringify(tc.expectedOutput))}" style="flex:1;">
        <label style="font-size:0.75rem; color:${tc.isPrivate ? '#f43f5e' : '#34d399'}; display:flex; align-items:center; gap:4px;">
          <input type="checkbox" class="tc-private-chk" ${tc.isPrivate ? 'checked' : ''}> Private
        </label>
      `;
      testCasesListContainer.appendChild(row);
    });
  }

  // Save / Publish Question to Database
  btnSaveQuestionDb.addEventListener('click', async () => {
    const payload = {
      title: qTitleInput.value.trim(),
      subject: qSubjectInput.value.trim(),
      module: qModuleInput.value.trim(),
      type: qTypeSelect.value,
      difficulty: qDifficultySelect.value,
      marks: parseFloat(qMarksInput.value) || 10,
      negativeMarks: parseFloat(qNegativeMarksInput.value) || 0,
      problemStatement: qBodyInput.value.trim()
    };

    if (payload.type === 'mcq') {
      const optInputs = document.querySelectorAll('.opt-input');
      const radioInputs = document.querySelectorAll('input[name="correct-opt-radio"]');
      const options = [];
      let correctAnswer = '';

      optInputs.forEach((inp, idx) => {
        const val = inp.value.trim();
        options.push(val);
        if (radioInputs[idx] && radioInputs[idx].checked) {
          correctAnswer = val;
        }
      });

      payload.options = options;
      payload.correctAnswer = correctAnswer || options[0];
    }

    try {
      const url = state.selectedStudioQuestionId ? `/api/questions/${state.selectedStudioQuestionId}` : '/api/questions';
      const method = state.selectedStudioQuestionId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        showToast('Question Saved', 'Question updated in database with private test case protection.');
        await loadQuestionsFromDatabase();
      } else {
        showToast('Save Failed', data.error || 'Server rejected question update.');
      }
    } catch (err) {
      showToast('Error', 'Failed to communicate with Question API.');
    }
  });

  // Duplicate Question
  btnDuplicateQuestion.addEventListener('click', async () => {
    if (!state.selectedStudioQuestionId) return;
    try {
      const res = await fetch(`/api/questions/${state.selectedStudioQuestionId}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast('Duplicated', 'Question duplicated as draft.');
        await loadQuestionsFromDatabase();
        studioQuestionSelector.value = data.question.id;
        loadQuestionIntoStudioForm(data.question.id);
      }
    } catch (e) {
      showToast('Error', 'Failed to duplicate question.');
    }
  });

  // New Question Form Reset
  btnNewQuestion.addEventListener('click', () => {
    state.selectedStudioQuestionId = null;
    qTitleInput.value = 'New Algorithmic Assessment Question';
    qSubjectInput.value = 'CS 401: Advanced Cryptography';
    qModuleInput.value = 'Module 5: Security';
    qMarksInput.value = 20;
    qBodyInput.value = 'Describe the problem statement here with markdown examples and constraints...';
    showToast('New Question Mode', 'Author your problem and click Save / Publish.');
  });

  studioQuestionSelector.addEventListener('change', (e) => {
    loadQuestionIntoStudioForm(e.target.value);
  });

  qTypeSelect.addEventListener('change', (e) => {
    toggleQuestionTypeFields(e.target.value);
  });

  // ==========================================================================
  // LEETCODE STUDENT EXAM WORKSPACE
  // ==========================================================================
  async function loadActiveExam() {
    try {
      const res = await fetch('/api/exams/1');
      const data = await res.json();
      if (data.exam) {
        state.activeExam = data.exam;
        state.activeExamSession = data.session;
        renderExamQuestionPalette();
        loadExamQuestion(0);
      }
    } catch (err) {
      console.warn('Failed to fetch active exam:', err);
    }
  }

  function renderExamQuestionPalette() {
    if (!state.activeExam || !state.activeExam.questions) return;
    examQNavPalette.innerHTML = '';

    state.activeExam.questions.forEach((q, idx) => {
      const btn = document.createElement('button');
      btn.className = `q-nav-btn ${idx === state.currentExamQuestionIndex ? 'active' : ''}`;
      btn.setAttribute('data-q-idx', idx);
      btn.textContent = `Q${idx + 1}: ${q.title.split(' ')[0]}`;

      btn.addEventListener('click', () => {
        loadExamQuestion(idx);
      });

      examQNavPalette.appendChild(btn);
    });
  }

  function loadExamQuestion(index) {
    if (!state.activeExam || !state.activeExam.questions) return;
    state.currentExamQuestionIndex = index;

    // Update palette active status
    document.querySelectorAll('.q-nav-btn').forEach((b, i) => {
      if (i === index) b.classList.add('active');
      else b.classList.remove('active');
    });

    const q = state.activeExam.questions[index];
    if (!q) return;

    studentQTitle.textContent = q.title;
    studentQDiff.textContent = q.difficulty.toUpperCase();
    studentQDiff.className = `badge-tag ${q.difficulty}`;
    studentQType.textContent = q.type.toUpperCase();
    studentQPoints.textContent = `${q.allocatedMarks || q.marks} Points`;

    // Render formatted markdown problem statement
    renderMarkdownProblem(q);

    // Toggle workspace pane based on question type
    if (q.type === 'coding') {
      codingWorkspaceWrapper.classList.remove('hidden');
      mcqWorkspaceWrapper.classList.add('hidden');
      descriptiveWorkspaceWrapper.classList.add('hidden');

      const savedCode = state.studentAnswers[q.id]?.code || getDefaultStarterCode(editorLangSelect.value, q);
      setEditorCode(savedCode, editorLangSelect.value);
      renderTestCaseDrawer(q);
    } else if (q.type === 'mcq') {
      codingWorkspaceWrapper.classList.add('hidden');
      mcqWorkspaceWrapper.classList.remove('hidden');
      descriptiveWorkspaceWrapper.classList.add('hidden');
      renderStudentMcqOptions(q);
    } else if (q.type === 'descriptive') {
      codingWorkspaceWrapper.classList.add('hidden');
      mcqWorkspaceWrapper.classList.add('hidden');
      descriptiveWorkspaceWrapper.classList.remove('hidden');
      const savedText = state.studentAnswers[q.id]?.answer || '';
      descriptiveAnswerInput.value = savedText;
      updateDescriptiveWordCount();
    }
  }

  function getCurrentExamQuestion() {
    if (!state.activeExam || !state.activeExam.questions) return null;
    return state.activeExam.questions[state.currentExamQuestionIndex];
  }

  function getDefaultStarterCode(lang, q) {
    const question = q || getCurrentExamQuestion();
    if (question && question.starterCode) {
      try {
        const codeMap = typeof question.starterCode === 'string' ? JSON.parse(question.starterCode) : question.starterCode;
        if (codeMap[lang]) return codeMap[lang];
      } catch (e) {}
    }

    if (lang === 'javascript') {
      return `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Write your optimal solution here
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`;
    }
    if (lang === 'python') {
      return `def two_sum(nums, target):
    # Write your optimal Python solution here
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`;
    }
    return `// Write your solution here`;
  }

  function renderMarkdownProblem(q) {
    const paragraphs = q.problemStatement.split('\n\n');
    let html = '';
    paragraphs.forEach(p => {
      if (p.startsWith('* ') || p.startsWith('- ')) {
        const items = p.split('\n').map(li => `<li>${escapeHTML(li.replace(/^[\*\-]\s*/, ''))}</li>`).join('');
        html += `<ul class="constraints-list">${items}</ul>`;
      } else {
        html += `<p style="margin-bottom:12px;">${escapeHTML(p)}</p>`;
      }
    });

    if (q.sampleTestCases && Array.isArray(q.sampleTestCases)) {
      q.sampleTestCases.forEach((tc, idx) => {
        html += `
          <h4 style="color:#ffffff; margin-top:14px;">Example ${idx + 1}:</h4>
          <div class="example-card">
            <strong>Input:</strong> ${escapeHTML(typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input))}<br>
            <strong>Output:</strong> ${escapeHTML(typeof tc.expectedOutput === 'string' ? tc.expectedOutput : JSON.stringify(tc.expectedOutput))}<br>
            ${tc.explanation ? `<strong>Explanation:</strong> ${escapeHTML(tc.explanation)}` : ''}
          </div>
        `;
      });
    }

    if (q.constraints) {
      html += `<h4 style="color:#ffffff; margin-top:14px;">Constraints:</h4><pre>${escapeHTML(q.constraints)}</pre>`;
    }

    studentQBody.innerHTML = html;
  }

  function renderTestCaseDrawer(q) {
    testcaseTabBar.innerHTML = '';
    const sampleTests = q.sampleTestCases || [
      { input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]' },
      { input: '[3, 2, 4], 6', expectedOutput: '[1, 2]' },
      { input: '[3, 3], 6', expectedOutput: '[0, 1]' }
    ];

    sampleTests.forEach((tc, idx) => {
      const btn = document.createElement('button');
      btn.className = `test-tab-btn ${idx === 0 ? 'active' : ''}`;
      btn.textContent = `Case ${idx + 1}`;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.test-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        displayTestCaseParams(tc);
      });
      testcaseTabBar.appendChild(btn);
    });

    const resultsBtn = document.createElement('button');
    resultsBtn.className = 'test-tab-btn';
    resultsBtn.id = 'tab-test-results';
    resultsBtn.textContent = 'Run Results';
    testcaseTabBar.appendChild(resultsBtn);

    displayTestCaseParams(sampleTests[0]);
  }

  function displayTestCaseParams(tc) {
    if (!tc) return;
    testcaseDrawerBody.innerHTML = `
      <div class="test-param-label">Input Parameters:</div>
      <div class="test-param-box">${escapeHTML(typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input))}</div>
      <div class="test-param-label">Expected Output:</div>
      <div class="test-param-box" style="color:#38bdf8;">${escapeHTML(typeof tc.expectedOutput === 'string' ? tc.expectedOutput : JSON.stringify(tc.expectedOutput))}</div>
    `;
  }

  // Run Code against test cases via backend execution sandbox
  btnRunTests.addEventListener('click', async () => {
    const q = getCurrentExamQuestion();
    if (!q) return;

    const code = getEditorCode();
    const language = editorLangSelect.value;
    const testCases = q.sampleTestCases || [{ input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]' }];

    testcaseDrawerBody.innerHTML = `
      <div style="text-align:center; padding:24px; color:#38bdf8;">
        <div>RUNNING IN ISOLATED SANDBOX...</div>
        <small style="color:var(--text-muted); font-family:var(--font-mono);">Evaluating against public test fixtures</small>
      </div>
    `;

    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, testCases })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        testExecTime.textContent = `Time: ${data.results[0]?.executionTimeMs || '1.2'}ms`;
        renderExecutionResults(data);
        showToast(data.allPassed ? 'Accepted' : 'Wrong Answer', `${data.passedCount}/${data.totalCount} Test Cases Passed.`);
      } else {
        testcaseDrawerBody.innerHTML = `
          <div class="test-result-badge failed">Execution Error</div>
          <pre style="color:#f87171; background:#060910; padding:10px; border-radius:4px;">${escapeHTML(data.error || 'Failed to execute solution')}</pre>
        `;
      }
    } catch (err) {
      testcaseDrawerBody.innerHTML = `<div style="color:#f87171;">Failed to connect to execution sandbox.</div>`;
    }
  });

  function renderExecutionResults(data) {
    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <span class="test-result-badge ${data.allPassed ? 'accepted' : 'failed'}">
          ${data.allPassed ? '✔ ALL TEST CASES PASSED' : '✖ WRONG ANSWER'} (${data.passedCount}/${data.totalCount})
        </span>
      </div>
    `;

    data.results.forEach(r => {
      html += `
        <div style="background:#060910; border:1px solid ${r.passed ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}; border-radius:6px; padding:10px; margin-bottom:8px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <strong style="color:${r.passed ? '#34d399' : '#f87171'};">Test Case ${r.testIndex}</strong>
            <span style="color:var(--text-muted); font-size:0.7rem;">${r.executionTimeMs}ms</span>
          </div>
          <div><span style="color:var(--text-muted)">Input:</span> ${escapeHTML(r.input)}</div>
          <div><span style="color:var(--text-muted)">Expected:</span> <span style="color:#38bdf8;">${escapeHTML(r.expected)}</span></div>
          <div><span style="color:var(--text-muted)">Output:</span> <span style="color:${r.passed ? '#34d399' : '#f87171'};">${escapeHTML(r.actual)}</span></div>
          ${r.stdout ? `<div style="margin-top:4px; font-size:0.72rem; color:#94a3b8;"><span style="color:#a855f7;">Stdout:</span> ${escapeHTML(r.stdout)}</div>` : ''}
          ${r.stderr ? `<div style="margin-top:4px; font-size:0.72rem; color:#f87171;"><span style="color:#f87171;">Stderr:</span> ${escapeHTML(r.stderr)}</div>` : ''}
        </div>
      `;
    });

    testcaseDrawerBody.innerHTML = html;
  }

  // Submit single solution
  btnSubmitSolution.addEventListener('click', () => {
    const q = getCurrentExamQuestion();
    if (!q) return;

    if (!state.studentAnswers[q.id]) state.studentAnswers[q.id] = {};
    state.studentAnswers[q.id].code = getEditorCode();
    state.studentAnswers[q.id].language = editorLangSelect.value;
    state.studentAnswers[q.id].status = 'solved';

    // Mark solved pill in navigation
    const activeNavBtn = document.querySelector(`.q-nav-btn[data-q-idx="${state.currentExamQuestionIndex}"]`);
    if (activeNavBtn) activeNavBtn.classList.add('solved');

    showToast('Solution Submitted', `Code for Question ${state.currentExamQuestionIndex + 1} recorded.`);
    autoSaveStudentDraft();
  });

  // Render MCQ choices for student
  function renderStudentMcqOptions(q) {
    studentMcqOptionsContainer.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const opts = Array.isArray(q.options) ? q.options : [];
    const savedAnswer = state.studentAnswers[q.id]?.answer;

    opts.forEach((optText, idx) => {
      const card = document.createElement('div');
      card.className = `mcq-choice-card ${savedAnswer === optText ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="mcq-letter-bubble">${letters[idx]}</div>
        <div style="flex:1; font-size:0.88rem; color:#e2e8f0;">${escapeHTML(optText)}</div>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.mcq-choice-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        if (!state.studentAnswers[q.id]) state.studentAnswers[q.id] = {};
        state.studentAnswers[q.id].answer = optText;
        state.studentAnswers[q.id].status = 'solved';

        const activeNavBtn = document.querySelector(`.q-nav-btn[data-q-idx="${state.currentExamQuestionIndex}"]`);
        if (activeNavBtn) activeNavBtn.classList.add('solved');

        showToast('Answer Selected', `Selected Option ${letters[idx]}.`);
        autoSaveStudentDraft();
      });

      studentMcqOptionsContainer.appendChild(card);
    });
  }

  // Descriptive text answer handler
  descriptiveAnswerInput.addEventListener('input', () => {
    const q = getCurrentExamQuestion();
    if (!q) return;

    if (!state.studentAnswers[q.id]) state.studentAnswers[q.id] = {};
    state.studentAnswers[q.id].answer = descriptiveAnswerInput.value;
    updateDescriptiveWordCount();
  });

  function updateDescriptiveWordCount() {
    const text = descriptiveAnswerInput.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    descriptiveWordCount.textContent = `Word Count: ${words}`;
  }

  // Auto-save student draft to server
  async function autoSaveStudentDraft() {
    try {
      examAutosaveStatus.textContent = 'Saving draft...';
      const res = await fetch('/api/exams/1/save-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: state.studentAnswers,
          currentQuestionIndex: state.currentExamQuestionIndex
        })
      });
      if (res.ok) {
        examAutosaveStatus.textContent = `✔ Draft auto-saved at ${new Date().toLocaleTimeString()}`;
      }
    } catch (e) {
      examAutosaveStatus.textContent = '⚠ Autosave offline (cached locally)';
    }
  }

  // Exam Submission Modal Workflow
  btnSubmitExamHud.addEventListener('click', () => {
    let completedCount = 0;
    if (state.activeExam && state.activeExam.questions) {
      state.activeExam.questions.forEach(q => {
        if (state.studentAnswers[q.id]) completedCount++;
      });
      modalCompletedCount.textContent = `${completedCount} of ${state.activeExam.questions.length}`;
    }
    modalTimeLeft.textContent = examTimerDisplay.textContent;
    modalViolationCount.textContent = state.proctoring.violations;
    examSubmitModal.classList.remove('hidden');
  });

  btnCancelSubmit.addEventListener('click', () => {
    examSubmitModal.classList.add('hidden');
  });

  btnConfirmSubmit.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/exams/1/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: state.studentAnswers })
      });
      const data = await res.json();

      examSubmitModal.classList.add('hidden');
      if (res.ok) {
        showToast('Exam Submitted', `Score: ${data.score}/${data.totalMarks} points. Exam finalized.`);
        triggerTargetedBlackout(`Examination finalized. Score: ${data.score}/${data.totalMarks}. Submission recorded.`);
      }
    } catch (err) {
      showToast('Submission Error', 'Failed to submit exam.');
    }
  });

  // ==========================================================================
  // ACTIVE ANTI-CAPTURE DEFENSES (OPSWAT ASC TARGETED OBSCURITY)
  // ==========================================================================

  // 1. FOCUS LOSS & BLUR SHIELD
  window.addEventListener('blur', () => {
    state.holdToRevealActive = false;
    wipeAllCanvasesBlack();
    triggerTargetedBlackout('Focus lost: Snipping Tool, application switch, or external capture shortcut detected.');
    recordViolation('Focus Loss / Potential Screen Capture');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      state.holdToRevealActive = false;
      wipeAllCanvasesBlack();
      triggerTargetedBlackout('Tab visibility hidden. Window minimized or switched.');
      recordViolation('Tab Hidden / Switch Violation');
    }
  });

  document.addEventListener('mouseleave', () => {
    state.holdToRevealActive = false;
    wipeAllCanvasesBlack();
    triggerTargetedBlackout('Cursor exited examination window boundary.');
    recordViolation('Cursor Exited Viewport (External Tool Suspected)');
  });

  // 2. HARDWARE KEYBOARD SHORTCUT INTERCEPTION
  window.addEventListener('keydown', (e) => {
    const isWindowsKey = e.key === 'Meta' || e.code === 'MetaLeft' || e.code === 'MetaRight' || e.key === 'OS';
    const isPrintScreen = e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44;
    const isAltKey = e.key === 'Alt' || e.code === 'AltLeft' || e.code === 'AltRight';
    const isDevTools = (e.ctrlKey && e.shiftKey) || e.key === 'F12' || e.keyCode === 123;
    const isPrintAction = e.ctrlKey && (e.key === 'p' || e.key === 'P');

    if (isWindowsKey || isPrintScreen || isAltKey || isDevTools || isPrintAction) {
      state.holdToRevealActive = false;
      wipeAllCanvasesBlack();

      if (isPrintScreen) {
        handlePrintScreenAttempt();
      } else if (isWindowsKey) {
        triggerTargetedBlackout('Windows Key (Meta) Intercepted: Snipping Tool sequence blocked.');
        recordViolation('Windows Key / Snipping Tool Pre-empted');
      } else if (isAltKey) {
        triggerTargetedBlackout('Alt Key Intercepted: Window capture shortcut pre-empted.');
        recordViolation('Alt Key Capture Pre-empted');
      } else if (isDevTools) {
        e.preventDefault();
        triggerTargetedBlackout('DevTools / Inspect Shortcut Blocked.');
        recordViolation('DevTools Shortcut Attempt');
      } else if (isPrintAction) {
        e.preventDefault();
        triggerTargetedBlackout('Print Action Blocked.');
        recordViolation('Print Action (Ctrl+P) Attempt');
      }
      return;
    }

    if (e.code === 'Space' && state.watermark.strategy === 'hold-to-reveal' && !e.repeat) {
      e.preventDefault();
      state.holdToRevealActive = true;
      renderAllCanvases();
    }
  }, true);

  window.addEventListener('keyup', (e) => {
    const isPrintScreen = e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44;
    if (isPrintScreen) {
      state.holdToRevealActive = false;
      wipeAllCanvasesBlack();
      handlePrintScreenAttempt();
      return;
    }

    if (e.code === 'Space' && state.watermark.strategy === 'hold-to-reveal') {
      state.holdToRevealActive = false;
      renderAllCanvases();
    }
  }, true);

  function handlePrintScreenAttempt() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('SECURITY ALERT: Unauthorized capture of confidential exam material is strictly prohibited.');
      }
    } catch (err) {}

    recordViolation('PrintScreen Key Intercepted');
    triggerTargetedBlackout('PrintScreen key pressed! Question content obscured and clipboard buffer purged.');
    showToast('Capture Blocked', 'PrintScreen key intercepted. Question locked.');
  }

  function triggerTargetedBlackout(reason) {
    state.proctoring.isBlackedOut = true;
    wipeAllCanvasesBlack();

    if (studentTargetedShield) studentTargetedShield.classList.remove('hidden');
    if (studioTargetedShield) studioTargetedShield.classList.remove('hidden');

    const shieldReasonText = document.getElementById('shield-reason-text');
    if (shieldReasonText) shieldReasonText.textContent = reason;

    const studioShieldReason = document.getElementById('studio-shield-reason');
    if (studioShieldReason) studioShieldReason.textContent = reason;
  }

  function restoreQuestionView() {
    state.proctoring.isBlackedOut = false;
    if (studentTargetedShield) studentTargetedShield.classList.add('hidden');
    if (studioTargetedShield) studioTargetedShield.classList.add('hidden');
    renderAllCanvases();
  }

  btnUnlockQuestion.addEventListener('click', (e) => {
    e.stopPropagation();
    restoreQuestionView();
  });

  btnUnlockStudio.addEventListener('click', (e) => {
    e.stopPropagation();
    restoreQuestionView();
  });

  function recordViolation(actionName) {
    state.proctoring.violations++;
    violationCountDisplay.textContent = state.proctoring.violations;

    const violationPayload = {
      examId: 1,
      sessionId: state.activeExamSession ? state.activeExamSession.id : null,
      violationType: actionName,
      severity: actionName.includes('PrintScreen') ? 'critical' : 'warning',
      details: `Hardware intercept: ${actionName}`
    };

    // Send to backend telemetry
    fetch('/api/telemetry/violation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(violationPayload)
    }).catch(() => {});

    // Broadcast over WebSocket
    if (state.socket) {
      state.socket.emit('candidate:violation', {
        candidateName: state.currentUser.fullName,
        studentId: state.currentUser.studentId || 'MIT-2026-CS8891',
        ...violationPayload
      });
    }
  }

  // ==========================================================================
  // WATERMARK RENDERING ENGINE
  // ==========================================================================
  function renderAllCanvases() {
    const width = 800;
    const height = 540;

    if (state.watermark.strategy === 'tiled-overlay') {
      previewModeTag.textContent = 'DUAL-LAYER DOM';
      previewCanvas.style.display = 'none';
      previewDomWrapper.classList.remove('hidden');
      renderDomOverlay();
    } else {
      const stratTitles = {
        'canvas-bake': 'CANVAS BAKED',
        'steganographic-dots': 'STEGANOGRAPHIC DOTS',
        'hold-to-reveal': state.holdToRevealActive ? 'HOLD ACTIVE (REVEALED)' : 'HOLD TO REVEAL (MASKED)',
        'spotlight-mask': 'DYNAMIC SPOTLIGHT MASK'
      };
      previewModeTag.textContent = stratTitles[state.watermark.strategy] || 'CANVAS BAKED';
      previewCanvas.style.display = 'block';
      previewDomWrapper.classList.add('hidden');
      drawQuestionOnCanvas(previewCanvas, width, height);
    }

    drawQuestionOnCanvas(studentCanvas, width, height);
    updateEditorWatermarkOverlay();
  }

  function wipeCanvasBlack(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f43f5e';
    ctx.font = '700 18px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CONTENT BLACKED OUT • ANTI-CAPTURE SHIELD ENGAGED', canvas.width / 2, canvas.height / 2);
    ctx.restore();
  }

  function wipeAllCanvasesBlack() {
    wipeCanvasBlack(previewCanvas);
    wipeCanvasBlack(studentCanvas);
  }

  function drawQuestionOnCanvas(canvas, w, h) {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    if (state.watermark.strategy === 'hold-to-reveal' && !state.holdToRevealActive) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#06b6d4';
      ctx.font = '700 16px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔒 CONTENT SECURED IN BLACKOUT MASK', w / 2, h / 2 - 16);
      ctx.font = '600 13px "Inter", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('PRESS & HOLD SPACEBAR OR HOLD MOUSE TO REVEAL', w / 2, h / 2 + 12);
      return;
    }

    ctx.fillStyle = '#090e1a';
    ctx.fillRect(0, 0, w, h);

    drawForensicWatermark(ctx, w, h);
    drawStudioQuestionContent(ctx, w, h);

    if (state.watermark.strategy === 'steganographic-dots') {
      drawSteganographicNoise(ctx, w, h);
    }
  }

  function drawForensicWatermark(ctx, w, h) {
    const wm = state.watermark;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate((wm.angle * Math.PI) / 180);
    ctx.translate(-w / 2, -h / 2);

    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillStyle = `rgba(255, 255, 255, ${wm.opacity})`;
    ctx.textAlign = 'center';

    const wmTextLine1 = `${wm.studentName.toUpperCase()} • ${wm.studentId}`;
    const wmTextLine2 = `SESSION: ${wm.sessionToken} • IP: ${wm.ipAddress}`;
    const wmTextLine3 = `DO NOT DISTRIBUTE • ${wm.timestamp}`;

    const xSpacing = 280;
    const ySpacing = 110;

    for (let x = -w * 0.8; x < w * 1.8; x += xSpacing) {
      for (let y = -h * 0.8; y < h * 1.8; y += ySpacing) {
        ctx.fillText(wmTextLine1, x, y);
        ctx.fillText(wmTextLine2, x, y + 18);
        ctx.fillText(wmTextLine3, x, y + 36);
      }
    }
    ctx.restore();
  }

  function drawStudioQuestionContent(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = '#06b6d4';
    ctx.font = '700 11px "Inter", sans-serif';
    ctx.fillText(qSubjectInput.value.toUpperCase(), 36, 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 17px "Inter", sans-serif';
    wrapText(ctx, qTitleInput.value, 36, 72, w - 72, 24);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '400 14px "Inter", sans-serif';
    wrapText(ctx, qBodyInput.value, 36, 126, w - 72, 22);

    // If MCQ options are visible
    if (qTypeSelect.value === 'mcq') {
      let currentY = 280;
      const letters = ['A', 'B', 'C', 'D'];
      const optInputs = document.querySelectorAll('.opt-input');
      optInputs.forEach((inp, idx) => {
        if (idx > 3) return;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        roundRect(ctx, 36, currentY - 18, w - 72, 38, 6, true, false);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '700 12px "JetBrains Mono", monospace';
        ctx.fillText(letters[idx], 52, currentY + 6);

        ctx.fillStyle = '#f1f5f9';
        ctx.font = '400 13px "Inter", sans-serif';
        const val = inp.value;
        const truncated = val.length > 85 ? val.substring(0, 82) + '...' : val;
        ctx.fillText(truncated, 84, currentY + 6);
        currentY += 48;
      });
    }

    ctx.restore();
  }

  function drawSteganographicNoise(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let i = 0; i < 400; i++) {
      const px = (i * 37 + 13) % w;
      const py = (i * 59 + 71) % h;
      ctx.fillRect(px, py, 2, 2);
    }
    ctx.restore();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const paragraphs = text.split('\n');
    let currentY = y;
    for (let i = 0; i < paragraphs.length; i++) {
      const words = paragraphs[i].split(' ');
      let line = '';
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, x, currentY);
          line = words[n] + ' ';
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
      currentY += lineHeight;
    }
    return currentY;
  }

  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + height - radius);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function renderDomOverlay() {
    previewDomContent.innerHTML = `
      <div style="color: #06b6d4; font-size: 11px; font-weight:700; margin-bottom: 8px;">${escapeHTML(qSubjectInput.value.toUpperCase())}</div>
      <h3 style="color:#ffffff; font-size:16px; margin-bottom:12px;">${escapeHTML(qTitleInput.value)}</h3>
      <p style="color:#cbd5e1; font-size:13px; line-height:1.5; white-space:pre-wrap;">${escapeHTML(qBodyInput.value)}</p>
    `;

    previewDomWatermark.innerHTML = '';
    previewDomWatermark.style.transform = `rotate(${state.watermark.angle}deg)`;
    const tileText = `${state.watermark.studentName.toUpperCase()} • ${state.watermark.studentId} • ${state.watermark.sessionToken}`;
    for (let i = 0; i < 35; i++) {
      const tile = document.createElement('div');
      tile.className = 'wm-tile-text';
      tile.style.color = `rgba(255, 255, 255, ${state.watermark.opacity})`;
      tile.textContent = tileText;
      previewDomWatermark.appendChild(tile);
    }
  }

  function updateWatermarkPayloadText() {
    const wm = state.watermark;
    const text = `Candidate: ${wm.studentName} | ID: ${wm.studentId} | IP: ${wm.ipAddress} | Exam: ${wm.examId} | Session: ${wm.sessionToken} • ${wm.timestamp}`;
    forensicPayloadDisplay.innerHTML = `<code>${escapeHTML(text)}</code>`;
  }

  // ==========================================================================
  // FORENSIC LEAK TRACER LABORATORY
  // ==========================================================================
  function renderTracerSample() {
    const w = 600;
    const h = 380;
    const ctx = tracerCanvas.getContext('2d');
    tracerCanvas.width = w;
    tracerCanvas.height = h;

    ctx.fillStyle = state.tracerMode === 'glare' ? '#111827' : '#080d19';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.font = '700 13px "Inter", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("CS 401: Advanced Cryptography", 24, 34);

    ctx.font = '600 12px "Inter", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText("Zero-Knowledge SNARK Proof Witness Constraint System...", 24, 60);

    ctx.translate(w / 2, h / 2);
    ctx.rotate((-28 * Math.PI) / 180);
    ctx.translate(-w / 2, -h / 2);

    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.textAlign = 'center';

    const text1 = `SARAH JENKINS • MIT-2026-CS8891`;
    const text2 = `IP: 192.168.1.142 • SESSION: ${state.watermark.sessionToken}`;

    for (let x = -w * 0.5; x < w * 1.5; x += 220) {
      for (let y = -h * 0.5; y < h * 1.5; y += 80) {
        ctx.fillText(text1, x, y);
        ctx.fillText(text2, x, y + 16);
      }
    }
    ctx.restore();

    // Apply Image Filters (Contrast / Invert / Stego)
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      if (state.tracerFilter === 'contrast') {
        const avg = (data[i] + data[i+1] + data[i+2]) / 3;
        const val = avg > 90 ? 255 : 0;
        data[i] = val; data[i+1] = val; data[i+2] = val;
      } else if (state.tracerFilter === 'invert') {
        data[i] = 255 - data[i];
        data[i+1] = 255 - data[i+1];
        data[i+2] = 255 - data[i+2];
      } else {
        const noise = (Math.random() - 0.5) * 15;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
        data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  btnRunForensicScan.addEventListener('click', async () => {
    tracerResultsBox.classList.remove('empty');
    tracerResultsBox.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div style="color: #06b6d4; font-size: 14px; font-weight: 600; margin-bottom: 8px;">SCANNING FREQUENCY PATTERNS & REGISTRY...</div>
        <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">Extracting steganographic tiles & querying backend database</div>
      </div>
    `;

    try {
      const res = await fetch('/api/forensics/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken: state.watermark.sessionToken,
          rawPayload: `Candidate: Sarah Jenkins | ID: MIT-2026-CS8891 | IP: 192.168.1.142 | Session: ${state.watermark.sessionToken}`
        })
      });
      const data = await res.json();

      if (res.ok) {
        const meta = data.extractedMetadata;
        tracerResultsBox.innerHTML = `
          <div class="match-header">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="12" r="3"/></svg>
            <div>
              <h4 style="font-size: 1rem; color: #f43f5e; font-weight: 700;">CONFIRMED FORENSIC MATCH (99.8% CONFIDENCE)</h4>
              <p style="font-size: 0.76rem; color: var(--text-secondary); margin: 0;">Watermark pattern extracted and verified against examination registry.</p>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 12px;">
            <div class="match-row"><span>Culprit Candidate Name:</span><span style="color: #38bdf8; font-weight:600;">${escapeHTML(meta.candidateName)}</span></div>
            <div class="match-row"><span>Student Registration ID:</span><span>${escapeHTML(meta.studentId)}</span></div>
            <div class="match-row"><span>Verified IP Address:</span><span>${escapeHTML(meta.candidateIp)}</span></div>
            <div class="match-row"><span>Cryptographic Session Hash:</span><span>${escapeHTML(meta.sessionToken)}</span></div>
            <div class="match-row"><span>Course & Exam Reference:</span><span>${escapeHTML(meta.examTitle)} (${escapeHTML(meta.examCode)})</span></div>
            <div class="match-row"><span>Attribution Verdict:</span><span style="color:#34d399;">${escapeHTML(data.forensicAnalysis.attributionVerdict)}</span></div>
          </div>

          <div style="margin-top: 16px; padding: 12px; background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 6px; font-size: 0.78rem; color: #fca5a5;">
            <strong>Enforcement Recommendation:</strong> ${escapeHTML(data.recommendedAction)}
            <div style="margin-top:8px;">
              <button class="btn btn-sm btn-primary" id="btn-flag-culprit" style="background:#f43f5e; border-color:#f43f5e;">Disqualify & Flag Candidate</button>
            </div>
          </div>
        `;

        document.getElementById('btn-flag-culprit')?.addEventListener('click', async () => {
          await fetch('/api/forensics/flag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionToken: meta.sessionToken, reason: 'Unauthorized capture leak' })
          });
          showToast('Candidate Disqualified', 'Sarah Jenkins flagged for academic integrity board review.');
        });
      }
    } catch (err) {
      tracerResultsBox.innerHTML = `<div style="color:#f87171; padding:20px;">Analysis engine failed to connect.</div>`;
    }
  });

  // Tracer Mode & Filter Toggles
  btnLeakPhone.addEventListener('click', () => { state.tracerMode = 'phone'; renderTracerSample(); });
  btnLeakScreenshot.addEventListener('click', () => { state.tracerMode = 'screenshot'; renderTracerSample(); });
  btnLeakGlare.addEventListener('click', () => { state.tracerMode = 'glare'; renderTracerSample(); });

  filterBtnRaw.addEventListener('click', () => { state.tracerFilter = 'raw'; renderTracerSample(); });
  filterBtnContrast.addEventListener('click', () => { state.tracerFilter = 'contrast'; renderTracerSample(); });
  filterBtnInvert.addEventListener('click', () => { state.tracerFilter = 'invert'; renderTracerSample(); });
  filterBtnDots.addEventListener('click', () => { state.tracerFilter = 'dots'; renderTracerSample(); });

  // ==========================================================================
  // INVIGILATOR COMMAND CENTER
  // ==========================================================================
  async function refreshCandidateRoster() {
    try {
      const res = await fetch('/api/exams/1/sessions');
      const data = await res.json();
      if (data.sessions && candidateRosterTbody) {
        candidateRosterTbody.innerHTML = '';
        data.sessions.forEach(sess => {
          const user = sess.user || {};
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>${escapeHTML(user.fullName || 'Candidate')}</strong></td>
            <td>${escapeHTML(user.studentId || 'N/A')}</td>
            <td><code>${escapeHTML(sess.candidateIp || '127.0.0.1')}</code></td>
            <td><code>${escapeHTML(sess.sessionToken)}</code></td>
            <td><span class="stat-value ${sess.violationCount > 0 ? 'danger' : ''}">${sess.violationCount}</span></td>
            <td><span class="status-badge-pill ${sess.status === 'flagged' ? 'flagged' : 'active'}">${escapeHTML(sess.status)}</span></td>
            <td>
              <div class="action-btn-group">
                <button class="btn-icon-xs btn-warn-candidate" data-session="${sess.id}" data-name="${escapeHTML(user.fullName)}">Warn</button>
                <button class="btn-icon-xs danger btn-lock-candidate" data-session="${sess.id}">Lock</button>
              </div>
            </td>
          `;
          candidateRosterTbody.appendChild(tr);
        });
        bindInvigilatorActionButtons();
      }
    } catch (err) {}
  }

  function bindInvigilatorActionButtons() {
    document.querySelectorAll('.btn-warn-candidate').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        const sessId = btn.getAttribute('data-session');
        fetch('/api/telemetry/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessId,
            actionType: 'warning',
            message: `Official Invigilator Warning to ${name}: Repeated screenshot keystrokes or focus changes detected on your session. Disqualification imminent.`
          })
        }).then(() => {
          showToast('Warning Dispatched', `Official security warning sent to ${name}.`);
        });
      });
    });

    document.querySelectorAll('.btn-lock-candidate').forEach(btn => {
      btn.addEventListener('click', () => {
        const sessId = btn.getAttribute('data-session');
        fetch('/api/telemetry/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessId,
            actionType: 'lock',
            message: 'Session temporarily locked by exam invigilator.'
          })
        }).then(() => {
          showToast('Screen Locked', 'Candidate screen locked remotely.');
        });
      });
    });
  }

  function appendInvigilatorLog(violation) {
    if (!invigilatorLogStream) return;
    const timeStr = new Date().toTimeString().split(' ')[0];
    const entry = document.createElement('div');
    entry.className = `audit-log-entry ${violation.severity || 'warning'}`;
    entry.innerHTML = `
      <span class="log-time">${timeStr}</span>
      <span class="log-msg"><strong>${escapeHTML(violation.candidateName || 'Candidate')}:</strong> ${escapeHTML(violation.violationType)}</span>
    `;
    invigilatorLogStream.prepend(entry);
  }

  btnRefreshRoster.addEventListener('click', refreshCandidateRoster);

  // ==========================================================================
  // ROLE SWITCHER & NAVIGATION
  // ==========================================================================
  btnRoleMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    roleDropdown.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    roleDropdown.classList.remove('show');
  });

  roleMenuItems.forEach(item => {
    item.addEventListener('click', async () => {
      const targetRole = item.getAttribute('data-role');
      try {
        const res = await fetch('/api/auth/switch-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetRole })
        });
        const data = await res.json();

        if (res.ok) {
          state.currentUser = data.user;
          state.token = data.token;

          // Update header display
          headerUserName.textContent = data.user.fullName;
          headerRoleBadge.textContent = data.user.role.toUpperCase();
          headerRoleBadge.className = `role-badge-tag ${data.user.role}`;

          roleMenuItems.forEach(m => m.classList.remove('active'));
          item.classList.add('active');

          showToast('Role Switched', `Active context: ${data.user.fullName} (${data.user.role.toUpperCase()})`);

          // Automatically navigate to best view for role
          if (data.user.role === 'admin') switchTab('view-studio');
          else if (data.user.role === 'student') switchTab('view-exam');
          else if (data.user.role === 'invigilator') switchTab('view-invigilator');
        }
      } catch (e) {
        showToast('Error', 'Failed to switch role.');
      }
    });
  });

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.getAttribute('data-target'));
    });
  });

  function switchTab(targetId) {
    state.currentTab = targetId;
    navTabs.forEach(t => {
      if (t.getAttribute('data-target') === targetId) t.classList.add('active');
      else t.classList.remove('active');
    });

    viewPanels.forEach(p => {
      if (p.id === targetId) p.classList.add('active');
      else p.classList.remove('active');
    });

    if (targetId === 'view-studio') {
      renderAllCanvases();
    } else if (targetId === 'view-exam') {
      renderAllCanvases();
    } else if (targetId === 'view-invigilator') {
      refreshCandidateRoster();
    } else if (targetId === 'view-tracer') {
      renderTracerSample();
    }
  }

  // ==========================================================================
  // UTILITY HELPERS & TIMERS
  // ==========================================================================
  function setupEventListeners() {
    // Watermark Opacity & Angle Sliders
    wmOpacityRange.addEventListener('input', () => {
      wmOpacityVal.textContent = wmOpacityRange.value;
      state.watermark.opacity = parseFloat(wmOpacityRange.value);
      renderAllCanvases();
    });

    wmAngleRange.addEventListener('input', () => {
      wmAngleVal.textContent = `${wmAngleRange.value}°`;
      state.watermark.angle = parseInt(wmAngleRange.value, 10);
      renderAllCanvases();
    });

    wmStrategyRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        state.watermark.strategy = radio.value;
        renderAllCanvases();
      });
    });

    btnLaunchExam.addEventListener('click', () => {
      switchTab('view-exam');
      showToast('Exam Environment Armed', 'Anti-screenshot and focus shields are active.');
    });

    btnAckWarning.addEventListener('click', () => {
      invigilatorWarningModal.classList.add('hidden');
    });

    btnSimulateSnipping.addEventListener('click', () => {
      triggerTargetedBlackout('Simulated Snipping Tool trigger: Focus lost, question instantly obscured.');
      recordViolation('Simulated Snipping Tool Grab');
      showToast('Question Obscured', 'Only the question is blacked out. Exam continues uninterrupted.');
    });

    btnSimulatePrintscreen.addEventListener('click', () => {
      handlePrintScreenAttempt();
    });

    btnDownloadPreview.addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = `watermarked_question_${state.watermark.studentId}.png`;
      link.href = previewCanvas.toDataURL('image/png');
      link.click();
      showToast('Sample Exported', 'Downloaded PNG with embedded forensic watermark.');
    });

    // Language selector change in editor
    editorLangSelect.addEventListener('change', () => {
      const lang = editorLangSelect.value;
      const q = getCurrentExamQuestion();
      const code = getDefaultStarterCode(lang, q);
      setEditorCode(code, lang);
    });

    editorThemeSelect.addEventListener('change', () => {
      if (state.monacoEditor) {
        monaco.editor.setTheme(editorThemeSelect.value);
      }
    });

    btnResetCode.addEventListener('click', () => {
      const lang = editorLangSelect.value;
      const q = getCurrentExamQuestion();
      setEditorCode(getDefaultStarterCode(lang, q), lang);
      showToast('Code Reset', 'Starter template restored.');
    });
  }

  function startExamTimer() {
    if (state.proctoring.timerInterval) return;
    state.proctoring.timerInterval = setInterval(() => {
      if (state.proctoring.examTimeRemaining > 0) {
        state.proctoring.examTimeRemaining--;
        const mins = Math.floor(state.proctoring.examTimeRemaining / 60);
        const secs = state.proctoring.examTimeRemaining % 60;
        examTimerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
    }, 1000);
  }

  function showToast(title, message) {
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 4000);
  }

  function escapeHTML(str) {
    if (typeof str !== 'string') return String(str);
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  setInterval(() => {
    const d = new Date();
    previewClock.textContent = d.toTimeString().split(' ')[0] + ' UTC';
  }, 1000);

  // Kickoff
  initializeApplication();
});
