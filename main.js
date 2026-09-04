// ===================================================
// 公倍数ステップ★たまごのひみつ - メインゲームスクリプト
// ===================================================

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
  btnSyncOpen: document.getElementById('btn-sync-open'),
  
  // タイトル卵ディスプレイ
  eggContainer: document.getElementById('egg-container'),
  eggDisplayImg: document.getElementById('egg-display-img'),
  eggOverlay: document.getElementById('egg-overlay'),
  eggStageTag: document.getElementById('egg-stage-tag'),
  totalCorrectDisplay: document.getElementById('total-correct-display'),
  nextCrackHint: document.getElementById('next-crack-hint'),
  
  // ゲーム画面
  sessionCorrectVal: document.getElementById('session-correct-val'),
  btnFinishGame: document.getElementById('btn-finish-game'),
  miniEggStatus: document.getElementById('mini-egg-status'),
  miniEggIcon: document.getElementById('mini-egg-icon'),
  miniCorrectCount: document.getElementById('mini-correct-count'),
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
  
  // リザルト画面
  finalSessionCorrect: document.getElementById('final-session-correct'),
  finalTotalCorrect: document.getElementById('final-total-correct'),
  finalEggStatus: document.getElementById('final-egg-status'),
  resultStars: document.getElementById('result-stars'),
  resultRank: document.getElementById('result-rank'),
  resultEggImg: document.getElementById('result-egg-img'),
  resultEggOverlay: document.getElementById('result-egg-overlay'),
  resultGainCorrect: document.getElementById('result-gain-correct'),
  resultTotalCorrect: document.getElementById('result-total-correct'),
  resultNextCrack: document.getElementById('result-next-crack'),
  nickname: document.getElementById('nickname'),
  btnRegister: document.getElementById('btn-register'),
  registerMsg: document.getElementById('register-msg'),
  btnRetry: document.getElementById('btn-retry'),
  btnBackTitle: document.getElementById('btn-back-title'),
  btnRankingClose: document.getElementById('btn-ranking-close'),
  rankingList: document.getElementById('ranking-list'),
  
  // 引継ぎモーダル
  modalSync: document.getElementById('modal-sync'),
  btnModalClose: document.getElementById('btn-modal-close'),
  syncNickname: document.getElementById('sync-nickname'),
  btnSyncSave: document.getElementById('btn-sync-save'),
  btnSyncLoad: document.getElementById('btn-sync-load'),
  syncMsg: document.getElementById('sync-msg'),
  
  // 進化お祝いモーダル
  modalEvolution: document.getElementById('modal-evolution'),
  evolutionTitle: document.getElementById('evolution-title'),
  evolutionImg: document.getElementById('evolution-img'),
  evolutionOverlay: document.getElementById('evolution-overlay'),
  evolutionDesc: document.getElementById('evolution-desc'),
  btnEvolutionClose: document.getElementById('btn-evolution-close')
};

// ===================================================
// 進捗ストレージ管理（累計正解数）
// ===================================================
const STORAGE_KEY = 'koubaisuu_egg_progress_v2';

let progress = {
  totalCorrect: 0,
  nickname: '',
  lastStage: 0
};

function loadLocalProgress() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      progress.totalCorrect = parseInt(parsed.totalCorrect, 10) || 0;
      progress.nickname = parsed.nickname || '';
      progress.lastStage = parseInt(parsed.lastStage, 10) || 0;
    }
  } catch (e) {
    console.warn('Progress load failed:', e);
  }
}

function saveLocalProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('Progress save failed:', e);
  }
}

// 卵ステージ情報の定義（問数は完全秘密）
const EGG_STAGES = [
  { stage: 0, min: 0, max: 99, name: '🌱 つるつるのたまご', img: 'assets/egg_stage0.jpg', 
    desc: 'まだヒビは入っていません。大事にあたためて育てよう！',
    hint: 'まあるいたまごを 大事に あたためているよ… なにが生まれるかな？ ✨' },
  { stage: 1, min: 100, max: 499, name: '✨ かすかなヒビ', img: 'assets/egg_stage1.jpg', 
    desc: 'ピキッ…！たまごに小さなしるしが入ったよ！命が元気に育っているみたい…！',
    hint: 'ピキッ…と小さなしるしが見えるよ。たまごが温まってきたみたい！ 🌱' },
  { stage: 2, min: 500, max: 999, name: '⚡ 小さなヒビ', img: 'assets/egg_stage2.jpg', 
    desc: 'ヒビが少しずつ枝分かれしてきたよ！たまごの中からコツコツ音がするかも…？',
    hint: 'コツコツ…と中から音が聞こえるよ！元気に育っているね！ 🎶' },
  { stage: 3, min: 1000, max: 1999, name: '🌟 広がるヒビ', img: 'assets/egg_stage3.jpg', 
    desc: 'たまご全体にヒビが広がってきたよ！中から元気な声が聞こえそう！',
    hint: 'ヒビが広がってきたよ！どんな鳥が生まれるかな…？ドキドキ！ 🌟' },
  { stage: 4, min: 2000, max: 2999, name: '💫 光あふれるヒビ', img: 'assets/egg_stage4.jpg', 
    desc: 'ヒビの隙間から神秘的な光が漏れ出している！奇跡が起きるかも！？',
    hint: 'ヒビからまぶしい光があふれている…！もうすぐ奇跡が起きるかも！？ 💫' },
  { stage: 5, min: 3000, max: 3999, name: '🔥 カタカタ揺れるたまご', img: 'assets/egg_stage4.jpg', 
    desc: 'ヒビが深くなって、たまごがカタカタ揺れている！いつ生まれるかな！？',
    hint: 'たまごがカタカタ激しく動いているよ！いつ生まれるかな…！？ 🔥',
    overlayType: 'stage5' },
  { stage: 6, min: 4000, max: 4999, name: '🐣 いまにも生まれそう！', img: 'assets/egg_stage4.jpg', 
    desc: '殻の中から可愛い瞳と羽がチラリ！もう生まれる寸前だよ！！',
    hint: '殻の中から可愛い瞳がチラリ！もう生まれる寸前だよ！！ 🐣',
    overlayType: 'stage6' },
  { stage: 7, min: 5000, max: Infinity, name: '👑 伝説の親鳥誕生！', img: 'assets/egg_stage4.jpg', 
    desc: '🎉 ついにパッカーン！！と殻が割れて、奇跡の親鳥が元気に誕生しました！！',
    hint: '🎉 奇跡の親鳥が元気に誕生しました！ずっと大切にしてね！ 👑',
    overlayType: 'stage7' }
];

function getEggStageInfo(correctCount) {
  for (let i = EGG_STAGES.length - 1; i >= 0; i--) {
    if (correctCount >= EGG_STAGES[i].min) {
      return EGG_STAGES[i];
    }
  }
  return EGG_STAGES[0];
}

// 卵オーバーレイのSVG生成
function getEggOverlayHTML(overlayType) {
  if (overlayType === 'stage5') {
    return `
      <svg viewBox="0 0 512 512" style="width:100%;height:100%;position:absolute;top:0;left:0;pointer-events:none;">
        <filter id="glow-s5"><feGaussianBlur stdDeviation="8" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
        <path d="M 230 160 L 255 225 L 215 285 L 285 345 L 260 385" stroke="#FFFFFF" stroke-width="12" fill="none" filter="url(#glow-s5)" stroke-linecap="round"/>
        <path d="M 255 225 L 315 245 L 335 295" stroke="#FFF" stroke-width="8" fill="none" filter="url(#glow-s5)" stroke-linecap="round"/>
        <path d="M 230 160 L 255 225 L 215 285 L 285 345 L 260 385" stroke="#FFD700" stroke-width="6" fill="none" stroke-linecap="round"/>
        <circle cx="240" cy="230" r="14" fill="#FFF" filter="url(#glow-s5)"/>
        <circle cx="280" cy="300" r="10" fill="#FFEAA7" filter="url(#glow-s5)"/>
      </svg>
    `;
  }
  if (overlayType === 'stage6') {
    return `
      <svg viewBox="0 0 512 512" style="width:100%;height:100%;position:absolute;top:0;left:0;pointer-events:none;">
        <filter id="glow-s6"><feGaussianBlur stdDeviation="8" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
        <ellipse cx="260" cy="260" rx="65" ry="50" fill="#2C1810" />
        <ellipse cx="260" cy="260" rx="60" ry="46" fill="#FDCB6E" filter="url(#glow-s6)" opacity="0.6"/>
        <ellipse cx="260" cy="265" rx="42" ry="34" fill="#FFEAA7" />
        <circle cx="242" cy="258" r="7" fill="#2D3436" />
        <circle cx="240" cy="256" r="2.5" fill="#FFF" />
        <circle cx="278" cy="258" r="7" fill="#2D3436" />
        <circle cx="276" cy="256" r="2.5" fill="#FFF" />
        <circle cx="233" cy="266" r="6" fill="#FF7675" opacity="0.7" />
        <circle cx="287" cy="266" r="6" fill="#FF7675" opacity="0.7" />
        <polygon points="260,262 254,272 266,272" fill="#E17055" />
        <path d="M 195 240 L 220 250 L 210 270 L 230 285 L 205 300 L 240 315 L 280 318 L 310 300 L 295 275 L 325 255 L 305 235 L 270 215 L 240 220 Z" 
              fill="none" stroke="#FFF9E6" stroke-width="8" stroke-linejoin="round" />
      </svg>
    `;
  }
  if (overlayType === 'stage7') {
    return `
      <svg viewBox="0 0 512 512" class="parent-bird-active" style="width:100%;height:100%;position:absolute;top:0;left:0;pointer-events:none;">
        <defs>
          <radialGradient id="birdGrad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#FFEAA7" />
            <stop offset="60%" stop-color="#FDCB6E" />
            <stop offset="100%" stop-color="#F39C12" />
          </radialGradient>
          <radialGradient id="wingGrad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#74B9FF" />
            <stop offset="100%" stop-color="#0984E3" />
          </radialGradient>
          <filter id="glow-s7"><feGaussianBlur stdDeviation="12" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
        </defs>
        <circle cx="256" cy="270" r="140" fill="#FFF9E6" opacity="0.6" filter="url(#glow-s7)" />
        <!-- 割れた下の殻 -->
        <path d="M 170 320 Q 256 420 342 320 L 320 300 L 295 320 L 270 295 L 245 320 L 220 295 L 195 320 Z" 
              fill="#FFF9E6" stroke="#E0D0C0" stroke-width="4" />
        <!-- 親鳥の体 -->
        <ellipse cx="256" cy="270" rx="75" ry="70" fill="url(#birdGrad)" />
        <!-- 翼 -->
        <path d="M 185 260 Q 130 220 150 280 Q 170 310 200 290 Z" fill="url(#wingGrad)" />
        <path d="M 327 260 Q 382 220 362 280 Q 342 310 312 290 Z" fill="url(#wingGrad)" />
        <ellipse cx="256" cy="285" rx="45" ry="40" fill="#FFFDF5" opacity="0.9" />
        <ellipse cx="230" cy="245" rx="10" ry="12" fill="#2D3436" /><circle cx="227" cy="240" r="4.5" fill="#FFF" />
        <ellipse cx="282" cy="245" rx="10" ry="12" fill="#2D3436" /><circle cx="279" cy="240" r="4.5" fill="#FFF" />
        <circle cx="216" cy="258" r="10" fill="#FF7675" opacity="0.8" />
        <circle cx="296" cy="258" r="10" fill="#FF7675" opacity="0.8" />
        <path d="M 256 250 L 245 264 Q 256 270 267 264 Z" fill="#E17055" />
        <!-- 王冠 -->
        <path d="M 232 205 L 240 180 L 256 195 L 272 180 L 280 205 Z" fill="#FFD700" stroke="#E67E22" stroke-width="3" />
        <circle cx="256" cy="195" r="3" fill="#3498DB" />
        <!-- 天使の輪 -->
        <ellipse cx="256" cy="165" rx="35" ry="10" fill="none" stroke="#FFEAA7" stroke-width="5" filter="url(#glow-s7)" />
      </svg>
    `;
  }
  return '';
}

// UIの卵表示を更新
function updateEggDisplay() {
  const info = getEggStageInfo(progress.totalCorrect);
  
  // タイトル画面
  if (el.eggDisplayImg) el.eggDisplayImg.src = info.img;
  if (el.eggOverlay) el.eggOverlay.innerHTML = getEggOverlayHTML(info.overlayType);
  if (el.eggStageTag) el.eggStageTag.textContent = info.name;
  if (el.totalCorrectDisplay) el.totalCorrectDisplay.textContent = progress.totalCorrect.toLocaleString();
  if (el.nextCrackHint) el.nextCrackHint.textContent = info.hint;

  // ミニ卵（ゲーム画面）
  if (el.miniCorrectCount) el.miniCorrectCount.textContent = progress.totalCorrect;
  if (el.miniEggIcon) {
    if (info.stage >= 7) {
      el.miniEggIcon.textContent = '🕊️';
    } else if (info.stage >= 4) {
      el.miniEggIcon.textContent = '✨';
    } else {
      el.miniEggIcon.textContent = '🥚';
    }
  }
}

// ===================================================
// ゲーム状態管理
// ===================================================
// ゲーム状態管理（制限時間・コンボ・フィーバー全廃、自分のペースで学習）
// ===================================================
let state = {
  currentQ: null,
  currentStep: 0,
  inputValue: '',
  sessionCorrect: 0, // 今回のプレイでの正解数
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
  if (screenName === 'title') {
    updateEggDisplay();
  }
}

// サウンド切替
el.btnSoundToggle.addEventListener('click', () => {
  const isMuted = sounds.toggleMute();
  el.btnSoundToggle.textContent = isMuted ? '🔇' : '🔊';
});

// ゲーム開始
async function startGame() {
  sounds.playClick();
  state.currentStep = 0;
  state.inputValue = '';
  state.sessionCorrect = 0;
  
  updateDisplays();
  showScreen('game');

  try {
    state.sessionToken = await api.getSessionToken();
  } catch (e) {
    console.warn("セッション取得失敗");
  }

  nextQuestion();
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
  if (el.sessionCorrectVal) el.sessionCorrectVal.textContent = state.sessionCorrect;
  if (el.miniCorrectCount) el.miniCorrectCount.textContent = progress.totalCorrect;
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
    sounds.playStepSuccess(state.currentStep);
    sounds.playEggBounce();
    
    // ミニ卵をポヨンと弾ませる
    el.miniEggIcon.classList.remove('bounce');
    void el.miniEggIcon.offsetWidth;
    el.miniEggIcon.classList.add('bounce');

    el.feedbackMsg.textContent = 'せいかい！✨';
    el.feedbackMsg.style.color = '#00B894';
    
    state.currentStep++;
    state.inputValue = '';
    
    if (state.currentStep > 2) {
      // 1問コンプリート！正解数を加算！
      state.sessionCorrect++;
      progress.totalCorrect++;
      saveLocalProgress();
      
      sounds.playQuestionClear();
      createConfetti(18);
      el.feedbackMsg.textContent = 'PERFECT! 🐣✨';
      updateStepUI();
      updateDisplays();

      // ステージ昇格チェック（ヒビが入るか親鳥誕生か）
      const currentStageInfo = getEggStageInfo(progress.totalCorrect);
      if (currentStageInfo.stage > progress.lastStage) {
        progress.lastStage = currentStageInfo.stage;
        saveLocalProgress();
        setTimeout(() => {
          triggerEvolutionModal(currentStageInfo);
        }, 350);
      }

      setTimeout(nextQuestion, 550);
    } else {
      updateStepUI();
      updateInputDisplay();
      updateDisplays();
    }
  } else {
    // 誤答処理（時間ペナルティなし）
    sounds.playWrong();
    el.feedbackMsg.textContent = 'おしい！もういちど';
    el.feedbackMsg.style.color = 'var(--primary)';
    state.inputValue = '';
    updateInputDisplay();
  }
}

// ゲーム終了・リザルト
function finishGame() {
  sounds.playResult();
  createConfetti(40);

  const currentStageInfo = getEggStageInfo(progress.totalCorrect);

  if (el.finalSessionCorrect) el.finalSessionCorrect.textContent = state.sessionCorrect;
  if (el.finalTotalCorrect) el.finalTotalCorrect.textContent = progress.totalCorrect.toLocaleString();
  if (el.finalEggStatus) el.finalEggStatus.textContent = currentStageInfo.name;

  // 称号の判定（今回の正解数に応じる）
  let stars = '★☆☆';
  let rank = '🌱 たまごみならい';
  if (state.sessionCorrect >= 20) {
    stars = '★★★';
    rank = '👑 公倍数ゴッドマスター';
  } else if (state.sessionCorrect >= 10) {
    stars = '★★★';
    rank = '🌟 公倍数マスター';
  } else if (state.sessionCorrect >= 5) {
    stars = '★★☆';
    rank = '🚀 スピードスター';
  } else if (state.sessionCorrect >= 1) {
    stars = '★☆☆';
    rank = '✨ 公倍数チャレンジャー';
  }
  el.resultStars.textContent = stars;
  el.resultRank.textContent = `称号: ${rank}`;

  // 卵成長リザルトの表示
  el.resultGainCorrect.textContent = `+${state.sessionCorrect}`;
  el.resultTotalCorrect.textContent = progress.totalCorrect.toLocaleString();
  el.resultEggImg.src = currentStageInfo.img;
  el.resultEggOverlay.innerHTML = getEggOverlayHTML(currentStageInfo.overlayType);

  if (currentStageInfo.stage >= 7) {
    el.resultNextCrack.innerHTML = '🎉 <strong>親鳥がパタパタ羽ばたいているよ！</strong>';
  } else if (state.sessionCorrect > 0) {
    const eggReactions = [
      '🥚 たまごが 嬉しそうに ポヨンと揺れたよ！',
      '✨ たまごが ほんのり あたたかくなったよ！',
      '💕 たまごが 元気いっぱいに 反応しているよ！',
      '🌱 たまごの中の いのちが 育っているよ…！',
      '🎶 たまごから コツコツと 音が返ってきたよ！'
    ];
    const reaction = eggReactions[Math.floor(Math.random() * eggReactions.length)];
    el.resultNextCrack.textContent = reaction;
  } else {
    el.resultNextCrack.textContent = 'たまごを 大事に あたため中…';
  }

  // ニックネームが既にある場合はGASへ自動バックアップ送信
  if (progress.nickname) {
    api.saveProgress(progress.nickname, progress.totalCorrect, currentStageInfo.name)
      .catch(e => console.warn('Auto backup failed:', e));
  }

  if (progress.nickname) {
    el.nickname.value = progress.nickname;
  }
  el.registerMsg.textContent = '';
  el.btnRegister.disabled = false;
  showScreen('result');
}

// 進化・ヒビ割れお祝いモーダル起動
function triggerEvolutionModal(stageInfo) {
  el.evolutionTitle.textContent = stageInfo.stage >= 7 ? '🎉 親鳥が生まれたよ！！ 🎉' : '✨ たまごにヒビが入ったよ！ ✨';
  el.evolutionImg.src = stageInfo.img;
  el.evolutionOverlay.innerHTML = getEggOverlayHTML(stageInfo.overlayType);
  el.evolutionDesc.innerHTML = stageInfo.desc;
  
  if (stageInfo.stage >= 7) {
    sounds.playHatchFanfare();
    createConfetti(100);
  } else {
    sounds.playCrack();
    createConfetti(50);
  }

  el.modalEvolution.classList.remove('hidden');
}

el.btnEvolutionClose.addEventListener('click', () => {
  sounds.playClick();
  el.modalEvolution.classList.add('hidden');
});

// イベントリスナー
el.btnStart.addEventListener('click', startGame);
el.btnRetry.addEventListener('click', startGame);
el.btnBackTitle.addEventListener('click', () => {
  sounds.playClick();
  showScreen('title');
});

if (el.btnFinishGame) {
  el.btnFinishGame.addEventListener('click', () => {
    sounds.playClick();
    finishGame();
  });
}

el.numBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    handleNumInput(btn.getAttribute('data-num'));
  });
});
el.btnClear.addEventListener('click', handleClear);
el.btnSubmit.addEventListener('click', handleSubmit);

// キーボード操作対応（テンキー対応）
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

// せいかい数ランキング登録
el.btnRegister.addEventListener('click', async () => {
  sounds.playClick();
  const name = el.nickname.value.trim();
  if (!name) {
    el.registerMsg.textContent = 'ニックネームを入力してね！';
    el.registerMsg.style.color = 'var(--primary)';
    return;
  }
  
  progress.nickname = name;
  saveLocalProgress();

  el.btnRegister.disabled = true;
  el.registerMsg.textContent = '登録中...';
  el.registerMsg.style.color = '#00B894';
  
  try {
    const currentStage = getEggStageInfo(progress.totalCorrect);
    await api.registerScore(name, progress.totalCorrect, state.sessionToken, currentStage.name);

    el.registerMsg.textContent = '🎉 登録が完了しました！';
    setTimeout(() => {
      showScreen('ranking');
      loadRanking();
    }, 800);
  } catch (err) {
    el.registerMsg.textContent = 'エラー: ' + err.message;
    el.registerMsg.style.color = 'var(--primary)';
    el.btnRegister.disabled = false;
  }
});

async function loadRanking() {
  el.rankingList.innerHTML = '<p class="loading-text">ランキングを読み込み中...</p>';
  try {
    const list = await api.getRanking();
    if (!list || list.length === 0) {
      el.rankingList.innerHTML = '<p class="loading-text">まだ記録がありません。たくさん解いて一番乗りを目指そう！</p>';
      return;
    }
    
    list.sort((a, b) => b.score - a.score);
    
    el.rankingList.innerHTML = list.map((item, index) => {
      let medal = `${index + 1}`;
      if (index === 0) medal = '🥇 1位';
      else if (index === 1) medal = '🥈 2位';
      else if (index === 2) medal = '🥉 3位';
      else medal = `${index + 1}位`;

      const stageBadge = item.stage ? `<span style="display:block;font-size:0.75rem;color:var(--text-sub);font-weight:normal;">${escapeHTML(item.stage)}</span>` : '';

      return `
        <div class="ranking-item">
          <div class="rank-num">${medal}</div>
          <div class="rank-name">${escapeHTML(item.name)}${stageBadge}</div>
          <div class="rank-score">${item.score} <span style="font-size:0.85rem">問</span></div>
        </div>
      `;
    }).join('');
  } catch (err) {
    el.rankingList.innerHTML = '<p class="loading-text">ランキングの読み込みに失敗しました。</p>';
  }
}

// ===================================================
// きろく引継ぎ・バックアップモーダル処理
// ===================================================
el.btnSyncOpen.addEventListener('click', () => {
  sounds.playClick();
  el.syncNickname.value = progress.nickname || '';
  el.syncMsg.textContent = '';
  el.modalSync.classList.remove('hidden');
});

el.btnModalClose.addEventListener('click', () => {
  sounds.playClick();
  el.modalSync.classList.add('hidden');
});

el.btnSyncSave.addEventListener('click', async () => {
  sounds.playClick();
  const name = el.syncNickname.value.trim();
  if (!name) {
    el.syncMsg.textContent = 'ニックネームを入力してね！';
    el.syncMsg.style.color = 'var(--primary)';
    return;
  }
  progress.nickname = name;
  saveLocalProgress();

  el.syncMsg.textContent = 'クラウドに保存中...';
  el.syncMsg.style.color = '#00B894';

  try {
    const stageInfo = getEggStageInfo(progress.totalCorrect);
    await api.saveProgress(name, progress.totalCorrect, stageInfo.name);
    el.syncMsg.textContent = '☁️ 保存が完了しました！いつでも引き継げます。';
  } catch (e) {
    el.syncMsg.textContent = '保存に失敗しました: ' + e.message;
    el.syncMsg.style.color = 'var(--primary)';
  }
});

el.btnSyncLoad.addEventListener('click', async () => {
  sounds.playClick();
  const name = el.syncNickname.value.trim();
  if (!name) {
    el.syncMsg.textContent = 'ニックネームを入力してね！';
    el.syncMsg.style.color = 'var(--primary)';
    return;
  }

  el.syncMsg.textContent = 'きろくを探しています...';
  el.syncMsg.style.color = '#00B894';

  try {
    const res = await api.loadProgress(name);
    if (res.exists) {
      progress.nickname = name;
      progress.totalCorrect = parseInt(res.totalCorrect, 10) || 0;
      const stageInfo = getEggStageInfo(progress.totalCorrect);
      progress.lastStage = stageInfo.stage;
      saveLocalProgress();
      updateEggDisplay();

      el.syncMsg.textContent = `🎉 「${name}」さんのきろく（${progress.totalCorrect}問）を復元しました！`;
      setTimeout(() => {
        el.modalSync.classList.add('hidden');
      }, 1500);
    } else {
      el.syncMsg.textContent = `「${name}」のきろくが見つかりませんでした。`;
      el.syncMsg.style.color = 'var(--primary)';
    }
  } catch (e) {
    el.syncMsg.textContent = '読み込みに失敗しました: ' + e.message;
    el.syncMsg.style.color = 'var(--primary)';
  }
});


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
  const colors = ['#FFD700', '#FF7675', '#55EFC4', '#74B9FF', '#FD79A8', '#A29BFE'];

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

// 初期化
loadLocalProgress();
updateEggDisplay();
