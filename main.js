// 要素の取得
const screens = {
  title: document.getElementById('screen-title'),
  game: document.getElementById('screen-game'),
  result: document.getElementById('screen-result'),
  ranking: document.getElementById('screen-ranking')
};

const el = {
  appContainer: document.getElementById('app-container'),
  btnStart: document.getElementById('btn-start'),
  btnRankingView: document.getElementById('btn-ranking-view'),
  btnSoundToggle: document.getElementById('btn-sound-toggle'),
  timeLeft: document.getElementById('time-left'),
  score: document.getElementById('score'),
  feverBar: document.getElementById('fever-bar'),
  comboBadge: document.getElementById('combo-badge'),
  comboCount: document.getElementById('combo-count'),
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
  finalMaxCombo: document.getElementById('final-max-combo'),
  resultStars: document.getElementById('result-stars'),
  resultRank: document.getElementById('result-rank'),
  nickname: document.getElementById('nickname'),
  btnRegister: document.getElementById('btn-register'),
  registerMsg: document.getElementById('register-msg'),
  btnRetry: document.getElementById('btn-retry'),
  btnBackTitle: document.getElementById('btn-back-title'),
  btnRankingClose: document.getElementById('btn-ranking-close'),
  rankingList: document.getElementById('ranking-list')
};

// ゲーム状態管理
let state = {
  score: 0,
  timeLeft: 90,
  timerId: null,
  currentQ: null,
  currentStep: 0,
  inputValue: '',
  correctCount: 0,
  combo: 0,
  maxCombo: 0,
  feverGauge: 0, // 0 ~ 100
  isFever: false,
  feverTimer: null,
  sessionToken: null
};

// 小学校5年生向けの厳選問題
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
  { a: 5, b: 6, lcm: 30 },
  { a: 6, b: 9, lcm: 18 },
  { a: 8, b: 12, lcm: 24 }
];

// 画面遷移
function showScreen(screenName) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[screenName].classList.add('active');
}

// サウンド切替
el.btnSoundToggle.addEventListener('click', () => {
  const isMuted = sounds.toggleMute();
  el.btnSoundToggle.textContent = isMuted ? '🔇' : '🔊';
});

// ゲーム開始
async function startGame() {
  sounds.playClick();
  state.score = 0;
  state.timeLeft = 90;
  state.currentStep = 0;
  state.inputValue = '';
  state.correctCount = 0;
  state.combo = 0;
  state.maxCombo = 0;
  state.feverGauge = 0;
  state.isFever = false;
  el.appContainer.classList.remove('fever-mode');
  
  updateDisplays();
  showScreen('game');

  try {
    state.sessionToken = await api.getSessionToken();
  } catch (e) {
    console.warn("セッション取得失敗");
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
  
  const q = questions[Math.floor(Math.random() * questions.length)];
  state.currentQ = {
    a: q.a,
    b: q.b,
    answers: [q.lcm, q.lcm * 2, q.lcm * 3]
  };

  el.question.innerHTML = `<span class="q-num">${q.a}</span> と <span class="q-num">${q.b}</span> の公倍数`;
  el.feedbackMsg.textContent = '';
  
  for (let i = 0; i < 3; i++) {
    el.steps[i].className = 'step-card';
    el.ansSlots[i].textContent = '?';
  }
  updateStepUI();
  updateInputDisplay();
}

function updateStepUI() {
  for (let i = 0; i < 3; i++) {
    if (i < state.currentStep) {
      el.steps[i].className = 'step-card done';
      el.ansSlots[i].textContent = state.currentQ.answers[i];
    } else if (i === state.currentStep) {
      el.steps[i].className = 'step-card active';
    } else {
      el.steps[i].className = 'step-card';
    }
  }
}

function updateDisplays() {
  el.timeLeft.textContent = state.timeLeft;
  el.score.textContent = state.score;
  el.feverBar.style.width = `${state.feverGauge}%`;

  if (state.combo >= 2) {
    el.comboBadge.classList.remove('hidden');
    el.comboCount.textContent = state.combo;
  } else {
    el.comboBadge.classList.add('hidden');
  }
}

function updateInputDisplay() {
  el.inputDisplay.textContent = state.inputValue || '_';
}

// 入力処理
function handleNumInput(num) {
  sounds.playClick();
  if (state.inputValue.length < 3) {
    state.inputValue += num;
    updateInputDisplay();
  }
}

function handleClear() {
  sounds.playClick();
  state.inputValue = '';
  updateInputDisplay();
}

function handleSubmit() {
  if (state.inputValue === '') return;
  
  const num = parseInt(state.inputValue, 10);
  const correctAns = state.currentQ.answers[state.currentStep];
  
  if (num === correctAns) {
    // 正解処理
    state.combo++;
    if (state.combo > state.maxCombo) state.maxCombo = state.combo;

    // スコア計算（コンボ倍率 ＋ フィーバー倍率）
    let multiplier = 1 + (state.combo - 1) * 0.15;
    if (state.isFever) multiplier *= 2;
    const addedScore = Math.round(10 * multiplier);
    state.score += addedScore;

    // フィーバーゲージ加算
    if (!state.isFever) {
      state.feverGauge += 15;
      if (state.feverGauge >= 100) {
        startFever();
      }
    }

    sounds.playStepSuccess(state.currentStep);
    el.feedbackMsg.textContent = `＋${addedScore}pt!`;
    el.feedbackMsg.style.color = 'var(--primary)';
    
    state.currentStep++;
    state.inputValue = '';
    
    if (state.currentStep > 2) {
      // 1問コンプリート！
      state.correctCount++;
      const bonusScore = Math.round(30 * multiplier);
      state.score += bonusScore;
      
      sounds.playQuestionClear();
      createConfetti(15);
      el.feedbackMsg.textContent = `PERFECT! ＋${bonusScore}pt!`;
      updateStepUI();
      updateDisplays();
      setTimeout(nextQuestion, 600);
    } else {
      updateStepUI();
      updateInputDisplay();
      updateDisplays();
    }
  } else {
    // 誤答処理
    sounds.playWrong();
    state.combo = 0;
    state.feverGauge = Math.max(0, state.feverGauge - 20);
    
    el.feedbackMsg.textContent = 'ちがうよ！(-3秒)';
    el.feedbackMsg.style.color = 'var(--accent)';
    state.timeLeft = Math.max(0, state.timeLeft - 3);
    state.inputValue = '';
    updateInputDisplay();
    updateDisplays();
  }
}

// フィーバーモード開始
function startFever() {
  state.isFever = true;
  state.feverGauge = 100;
  el.appContainer.classList.add('fever-mode');
  sounds.playFever();
  createConfetti(30);

  // 時間回復ボーナス (+5秒)
  state.timeLeft += 5;

  let timeLeftInFever = 8;
  if (state.feverTimer) clearInterval(state.feverTimer);
  state.feverTimer = setInterval(() => {
    timeLeftInFever--;
    state.feverGauge = (timeLeftInFever / 8) * 100;
    updateDisplays();
    if (timeLeftInFever <= 0) {
      clearInterval(state.feverTimer);
      state.isFever = false;
      state.feverGauge = 0;
      el.appContainer.classList.remove('fever-mode');
      updateDisplays();
    }
  }, 1000);
}

// ゲーム終了・リザルト
function endGame() {
  clearInterval(state.timerId);
  if (state.feverTimer) clearInterval(state.feverTimer);
  el.appContainer.classList.remove('fever-mode');
  
  sounds.playResult();
  createConfetti(50);

  el.finalScore.textContent = state.score;
  el.finalCorrect.textContent = state.correctCount;
  el.finalMaxCombo.textContent = state.maxCombo;

  // ランク＆星の判定
  let stars = '★☆☆';
  let rank = '公倍数ビギナー';
  if (state.score >= 500) {
    stars = '★★★';
    rank = '👑 公倍数ゴッドマスター';
  } else if (state.score >= 300) {
    stars = '★★★';
    rank = '🌟 公倍数マスター';
  } else if (state.score >= 150) {
    stars = '★★☆';
    rank = '🚀 スピードスター';
  } else if (state.score >= 80) {
    stars = '★☆☆';
    rank = '✨ 公倍数チャレンジャー';
  }
  el.resultStars.textContent = stars;
  el.resultRank.textContent = `称号: ${rank}`;

  el.nickname.value = '';
  el.registerMsg.textContent = '';
  el.btnRegister.disabled = false;
  showScreen('result');
}

// イベントリスナー
el.btnStart.addEventListener('click', startGame);
el.btnRetry.addEventListener('click', startGame);
el.btnBackTitle.addEventListener('click', () => {
  sounds.playClick();
  showScreen('title');
});

el.numBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    handleNumInput(btn.getAttribute('data-num'));
  });
});
el.btnClear.addEventListener('click', handleClear);
el.btnSubmit.addEventListener('click', handleSubmit);

// キーボード操作対応
window.addEventListener('keydown', (e) => {
  if (!screens.game.classList.contains('active')) return;
  if (e.key >= '0' && e.key <= '9') {
    handleNumInput(e.key);
  } else if (e.key === 'Enter') {
    handleSubmit();
  } else if (e.key === 'Backspace' || e.key === 'Escape') {
    handleClear();
  }
});

el.btnRankingView.addEventListener('click', async () => {
  sounds.playClick();
  showScreen('ranking');
  await loadRanking();
});
el.btnRankingClose.addEventListener('click', () => {
  sounds.playClick();
  showScreen('title');
});

el.btnRegister.addEventListener('click', async () => {
  sounds.playClick();
  const name = el.nickname.value.trim();
  if (!name) {
    el.registerMsg.textContent = 'ニックネームを入力してね！';
    el.registerMsg.style.color = 'var(--accent)';
    return;
  }
  
  el.btnRegister.disabled = true;
  el.registerMsg.textContent = '通信中...';
  el.registerMsg.style.color = 'var(--primary)';
  
  try {
    await api.registerScore(name, state.score, state.sessionToken);
    el.registerMsg.textContent = '🎉 登録が完了しました！';
    setTimeout(() => {
      showScreen('ranking');
      loadRanking();
    }, 800);
  } catch (err) {
    el.registerMsg.textContent = 'エラー: ' + err.message;
    el.registerMsg.style.color = 'var(--accent)';
    el.btnRegister.disabled = false;
  }
});

async function loadRanking() {
  el.rankingList.innerHTML = '<p class="loading-text">ランキングを読み込み中...</p>';
  try {
    const list = await api.getRanking();
    if (!list || list.length === 0) {
      el.rankingList.innerHTML = '<p class="loading-text">まだ記録がありません。一番乗りを目指そう！</p>';
      return;
    }
    
    // スコア降順ソート
    list.sort((a, b) => b.score - a.score);
    
    el.rankingList.innerHTML = list.map((item, index) => {
      let medal = `${index + 1}`;
      if (index === 0) medal = '🥇 1位';
      else if (index === 1) medal = '🥈 2位';
      else if (index === 2) medal = '🥉 3位';
      else medal = `${index + 1}位`;

      return `
        <div class="ranking-item">
          <div class="rank-num">${medal}</div>
          <div class="rank-name">${escapeHTML(item.name)}</div>
          <div class="rank-score">${item.score} <span style="font-size:0.8rem">pt</span></div>
        </div>
      `;
    }).join('');
  } catch (err) {
    el.rankingList.innerHTML = '<p class="loading-text">ランキングの読み込みに失敗しました。</p>';
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

// 紙吹雪パーティクル生成
function createConfetti(count = 30) {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  const particles = [];
  const colors = ['#FFD700', '#FF5722', '#4CAF50', '#00BCD4', '#E91E63', '#9C27B0'];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: -20,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 3 + 2,
      speedX: (Math.random() - 0.5) * 4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10
    });
  }

  let animationFrame;
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotSpeed;
      if (p.y < canvas.height + 20) alive = true;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    if (alive) {
      animationFrame = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrame);
    }
  }
  render();
}
