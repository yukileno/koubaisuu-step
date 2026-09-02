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

  // スコアの登録
  async registerScore(name, score, token) {
    if (USE_MOCK) {
      console.log(`Mock Register: ${name}, ${score}`);
      return new Promise(resolve => setTimeout(resolve, 500)); // 通信のモック遅延
    }
    
    // GASはCORS対応のため、リクエストボディにJSONを含める場合は no-cors 等の制約があるが、
    // GETや、form-urlencodedによるPOSTが基本。
    // 今回は Content-Type: application/json で doPost を呼び出す。
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'register',
        name: name,
        score: score,
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
    
    const res = await fetch(GAS_URL + "?action=getRanking", { method: 'GET' });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || '取得失敗');
    }
    return json.data;
  }
};
