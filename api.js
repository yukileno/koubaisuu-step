// GASのWebアプリURL
const GAS_URL = "https://script.google.com/macros/s/AKfycbzUWv4NrZrbapQfqZzLIhjDzDejNG3hhMbxU5wyDZ78vA2oYsADe2qNCWwQmUs5swpj/exec";

// モックフラグ (本番連携のため false に設定)
const USE_MOCK = false; 

const api = {
  // セッショントークンの取得 (不正防止用)
  async getSessionToken() {
    if (USE_MOCK) {
      return "mock_token_" + Date.now();
    }
    const res = await fetch(GAS_URL + "?action=getSession", { method: 'GET' });
    const json = await res.json();
    return json.token;
  },

  // スコア（正解数）の登録
  async registerScore(name, score, token, stageName) {
    if (USE_MOCK) {
      console.log(`Mock Register: ${name}, ${score}`);
      return new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // GASのCORS制約を回避するため text/plain でPOST送信（Simple Request）
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: 'register',
        name: name,
        score: score,
        stageName: stageName || '',
        token: token
      })
    });
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || '登録失敗');
    }
    return json;
  },

  // ランキング取得
  async getRanking() {
    if (USE_MOCK) {
      return new Promise(resolve => setTimeout(() => {
        resolve([
          { name: "テストユーザー1", score: 500 },
          { name: "テストユーザー2", score: 450 },
          { name: "テストユーザー3", score: 320 }
        ]);
      }, 500));
    }
    
    const res = await fetch(GAS_URL + "?action=getRanking");
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || '取得失敗');
    }
    return json.data;
  },

  // 累計進捗の保存 (バックアップ)
  async saveProgress(name, totalCorrect, stageName) {
    if (USE_MOCK) {
      console.log(`Mock SaveProgress: ${name}, ${totalCorrect}, ${stageName}`);
      return { success: true };
    }
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: 'saveProgress',
        name: name,
        totalCorrect: totalCorrect,
        stageName: stageName
      })
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || '進捗保存失敗');
    }
    return json;
  },

  // 累計進捗の読み出し (引き継ぎ)
  async loadProgress(name) {
    if (USE_MOCK) {
      return { success: true, exists: false, totalCorrect: 0 };
    }
    const res = await fetch(GAS_URL + "?action=loadProgress&name=" + encodeURIComponent(name));
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || '進捗読み出し失敗');
    }
    return json;
  },

  // クラス全員の合算進捗取得
  async getClassProgress() {
    if (USE_MOCK) {
      return { success: true, totalParticipants: 12, classTotalCorrect: 1250 };
    }
    const res = await fetch(GAS_URL + "?action=getClassProgress");
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'クラス進捗取得失敗');
    }
    return json;
  }
};
