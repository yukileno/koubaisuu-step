// スプレッドシートのID (スクリプトプロパティから取得することを推奨)
// PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')
const SHEET_NAME = 'Ranking';
const MAX_RANKING_COUNT = 20;
const SESSION_EXPIRE_MS = 1000 * 60 * 10; // 10分

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'register') {
      return handleRegister(data);
    }
    
    return createJsonResponse({ success: false, error: 'Unknown action' });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getSession') {
    // 簡易的なセッショントークン発行（現在時刻 + ランダム）
    const token = new Date().getTime() + "_" + Math.random().toString(36).substring(2);
    // 実際の運用ではここでTokenをスプレッドシートやCacheServiceに記録して検証する
    return createJsonResponse({ success: true, token: token });
  }
  
  if (action === 'getRanking') {
    return handleGetRanking();
  }
  
  return createJsonResponse({ success: false, error: 'Unknown action' });
}

function handleRegister(data) {
  const name = data.name ? data.name.toString().substring(0, 12) : "名無し";
  const score = parseInt(data.score, 10);
  
  if (isNaN(score) || score < 0 || score > 5000) {
    return createJsonResponse({ success: false, error: '不正なスコアです' });
  }
  
  // 排他制御 (同時書き込み防止)
  const lock = LockService.getScriptLock();
  if (lock.tryLock(5000)) {
    try {
      const sheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
      const ss = SpreadsheetApp.openById(sheetId);
      const sheet = ss.getSheetByName(SHEET_NAME);
      
      // データ追加
      sheet.appendRow([new Date(), name, score, data.token || ""]);
      
      // ソートして上位を維持
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const range = sheet.getRange(2, 1, lastRow - 1, 4);
        range.sort({column: 3, ascending: false}); // スコアの降順
      }
      
      return createJsonResponse({ success: true });
    } finally {
      lock.releaseLock();
    }
  } else {
    return createJsonResponse({ success: false, error: 'サーバーが混雑しています' });
  }
}

function handleGetRanking() {
  const sheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return createJsonResponse({ success: true, data: [] });
  }
  
  // 上位20件取得
  const limit = Math.min(lastRow - 1, MAX_RANKING_COUNT);
  const values = sheet.getRange(2, 2, limit, 2).getValues(); // Name, Score 列
  
  const result = values.map(function(row) {
    return { name: row[0], score: row[1] };
  });
  
  return createJsonResponse({ success: true, data: result });
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// OPTIONSメソッド（CORS対応）※ GASではdoPostとdoGetのみサポートされるが、
// Webアプリとして公開時、ブラウザのPreflightは自動的に200OKが返る。
