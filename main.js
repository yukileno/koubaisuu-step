// 要素の取得
const screens = {
  title: document.getElementById('screen-title'),
  game: document.getElementById('screen-game'),
  result: document.getElementById('screen-result'),
  ranking: document.getElementById('screen-ranking')
};

const el = {
  btnStart: document.getElementById('btn-start'),
  btnRankingView: document.getElementById('btn-ranking-view'),
  timeLeft: document.getElementById('time-left'),
  score: document.getElementById('score'),
  question: document.getElementById('current-question'),
  steps: [
    document.getElementById('step-0'),
    document.getElementById('step-1'),
    document.getElementById('step-2')
  ],
  ansSlots: [
    document.getElementById('ans-0'),
    document.getElementById('ans-1'),
    document.getElementById('ans-2')
  ],
  inputDisplay: document.getElementById('input-display'),
  feedbackMsg: document.getElementById('feedback-msg'),
  numBtns: document.querySelectorAll('.num-btn'),
  btnClear: document.getElementById('btn-clear'),
  btnSubmit: document.getElementById('btn-submit'),
  finalScore: document.getElementById('final-score'),
  finalCorrect: document.getElementById('final-correct'),
  nickname: document.getElementById('nickname'),
  btnRegister: document.getElementById('btn-register'),
  registerMsg: document.getElementById('register-msg'),
  btnRetry: document.getElementById('btn-retry'),
  btnBackTitle: document.getElementById('btn-back-title'),
  btnRankingClose: document.getElementById('btn-ranking-close'),
  rankingList: document.getElementById('ranking-list')
};

// ゲーム状態
let state = {
  score: 0,
  timeLeft: 90,
  timerId: null,
  currentQ: null,
  currentStep: 0, // 0, 1, 2
  inputValue: '',
  correctCount: 0,
  sessionToken: null
};

// 問題リスト (小学生向け)
const questions = [
  { a: 2, b: 3, lcm: 6 },
  { a: 3, b: 4, lcm: 12 },
  { a: 2, b: 5, lcm: 10 },
  { a: 4, b: 6, lcm: 12 },
  { a: 3, b: 6, lcm: 6 },
  { a: 4, b: 8, lcm: 8 },
  { a: 6, b: 8, lcm: 24 },
  { a: 3, b: 5, lcm: 15 },
  { a: 4, b: 5, lcm: 20 },
  { a: 5, b: 6, lcm: 30 }
];

// 画面遷移
function showScreen(screenName) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[screenName].classList.add('active');
}

// ゲーム開始
async function startGame() {
  state.score = 0;
  state.timeLeft = 90;
  state.currentStep = 0;
  state.inputValue = '';
  state.correctCount = 0;
  
  updateDisplays();
  showScreen('game');

  // APIからセッショントークンを取得(不正防止用)
  try {
    state.sessionToken = await api.getSessionToken();
  } catch (e) {
    console.warn("セッション取得失敗(モック環境の場合は無視)");
  }

  nextQuestion();
  
  if (state.timerId) clearInterval(state.timerId);
  state.timerId = setInterval(() => {
    state.timeLeft--;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      endGame();
    }
    updateDisplays();
  }, 1000);
}

// 次の問題
function nextQuestion() {
  state.currentStep = 0;
  state.inputValue = '';
  
  // ランダムに問題を選ぶ
  const q = questions[Math.floor(Math.random() * questions.length)];
  state.currentQ = {
    a: q.a,
    b: q.b,
    answers: [q.lcm, q.lcm * 2, q.lcm * 3]
  };

  el.question.textContent = `${q.a} と ${q.b} の公倍数`;
  el.feedbackMsg.textContent = '';
  el.feedbackMsg.style.color = '';
  
  // UIリセット
  for (let i = 0; i < 3; i++) {
    el.steps[i].className = 'step';
    el.ansSlots[i].textContent = '?';
  }
  updateStepUI();
  updateInputDisplay();
}

function updateStepUI() {
  for (let i = 0; i < 3; i++) {
    if (i < state.currentStep) {
      el.steps[i].className = 'step done';
      el.ansSlots[i].textContent = state.currentQ.answers[i];
    } else if (i === state.currentStep) {
      el.steps[i].className = 'step active';
    } else {
      el.steps[i].className = 'step';
    }
  }
}

function updateDisplays() {
  el.timeLeft.textContent = state.timeLeft;
  el.score.textContent = state.score;
}

function updateInputDisplay() {
  el.inputDisplay.textContent = state.inputValue || '_';
}

// 入力処理
function handleNumInput(num) {
  if (state.inputValue.length < 3) {
    state.inputValue += num;
    updateInputDisplay();
  }
}

function handleClear() {
  state.inputValue = '';
  updateInputDisplay();
}

function handleSubmit() {
  if (state.inputValue === '') return;
  
  const num = parseInt(state.inputValue, 10);
  const correctAns = state.currentQ.answers[state.currentStep];
  
  if (num === correctAns) {
    // 正解
    state.score += 10;
    el.feedbackMsg.textContent = 'せいかい！';
    el.feedbackMsg.style.color = 'var(--primary-color)';
    state.currentStep++;
    state.inputValue = '';
    
    if (state.currentStep > 2) {
      // 1問クリア
      state.correctCount++;
      state.score += 20; // 完了ボーナス
      updateDisplays();
      setTimeout(nextQuestion, 500);
    } else {
      updateStepUI();
      updateInputDisplay();
      updateDisplays();
    }
  } else {
    // 誤答ペナルティ
    el.feedbackMsg.textContent = 'ちがうよ！(-3秒)';
    el.feedbackMsg.style.color = 'var(--error-color)';
    state.timeLeft -= 3;
    if (state.timeLeft < 0) state.timeLeft = 0;
    state.inputValue = '';
    updateInputDisplay();
    updateDisplays();
  }
}

// ゲーム終了
function endGame() {
  clearInterval(state.timerId);
  el.finalScore.textContent = state.score;
  el.finalCorrect.textContent = state.correctCount;
  el.nickname.value = '';
  el.registerMsg.textContent = '';
  el.btnRegister.disabled = false;
  showScreen('result');
}

// イベントリスナー
el.btnStart.addEventListener('click', startGame);
el.btnRetry.addEventListener('click', startGame);
el.btnBackTitle.addEventListener('click', () => showScreen('title'));

el.numBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    handleNumInput(btn.getAttribute('data-num'));
  });
});
el.btnClear.addEventListener('click', handleClear);
el.btnSubmit.addEventListener('click', handleSubmit);

el.btnRankingView.addEventListener('click', async () => {
  showScreen('ranking');
  await loadRanking();
});
el.btnRankingClose.addEventListener('click', () => showScreen('title'));

el.btnRegister.addEventListener('click', async () => {
  const name = el.nickname.value.trim();
  if (!name) {
    el.registerMsg.textContent = 'ニックネームを入力してね';
    return;
  }
  
  el.btnRegister.disabled = true;
  el.registerMsg.textContent = 'とうろく中...';
  
  try {
    await api.registerScore(name, state.score, state.sessionToken);
    el.registerMsg.textContent = 'とうろくしました！';
    setTimeout(() => {
      showScreen('ranking');
      loadRanking();
    }, 1000);
  } catch (err) {
    el.registerMsg.textContent = 'エラーがおきました: ' + err.message;
    el.btnRegister.disabled = false;
  }
});

async function loadRanking() {
  el.rankingList.innerHTML = '<p>読み込み中...</p>';
  try {
    const list = await api.getRanking();
    if (list.length === 0) {
      el.rankingList.innerHTML = '<p>まだランキングがありません。</p>';
      return;
    }
    el.rankingList.innerHTML = list.map((item, index) => `
      <div class="ranking-item">
        <div class="rank-num">${index + 1}</div>
        <div class="rank-name">${escapeHTML(item.name)}</div>
        <div class="rank-score">${item.score}</div>
      </div>
    `).join('');
  } catch (err) {
    el.rankingList.innerHTML = '<p>ランキングの取得に失敗しました。</p>';
  }
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag])
  );
}
