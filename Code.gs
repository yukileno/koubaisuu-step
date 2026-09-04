/**
 * 算数学習Webアプリ 統合ランキング管理バックエンド
 * 公倍数、約数、その他の単元を1つのスプレッドシートでタブ分け集中管理
 */

const DEFAULT_SHEET = '公倍数';
const MAX_RANKING_COUNT = 20;

// 単元コードとシート名のマッピング
const UNIT_MAP = {
  'koubaisuu': '公倍数',
  'yakusuu': '約数',
  'kouyakusuu': '公約数'
};

function getSheetName(unit) {
  if (!unit) return DEFAULT_SHEET;
  const key = unit.toString().toLowerCase().trim();
  return UNIT_MAP[key] || unit.toString();
}

/**
 * 統合スプレッドシートを取得
 */
function getSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  let sheetId = props.getProperty('SPREADSHEET_ID') || '1mEh0lkapIp-UmHJ2_dLaAzk9I1h9q--_3EoK59CVo1w';
  return SpreadsheetApp.openById(sheetId);
}

/**
 * 指定した単元のシートを取得（存在しなければヘッダー付きで自動作成）
 */
function getOrCreateUnitSheet(ss, unit) {
  const sheetName = getSheetName(unit);
  let sheet = ss.getSheetByName(sheetName);
  
  // 旧デフォルトの「Ranking」シートがあれば「公倍数」にリネーム
  if (!sheet && sheetName === '公倍数') {
    sheet = ss.getSheetByName('Ranking');
    if (sheet) {
      sheet.setName('公倍数');
    }
  }

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // ヘッダー行が存在しないか空ならセット
  if (sheet.getRange(1, 1).getValue() === '') {
    const headers = [['日時', 'ニックネーム', 'スコア', 'トークン']];
    sheet.getRange(1, 1, 1, 4).setValues(headers);
    sheet.getRange(1, 1, 1, 4)
      .setBackground('#43A047')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 180);
    sheet.setColumnWidth(2, 160);
    sheet.setColumnWidth(3, 110);
    sheet.setColumnWidth(4, 220);
    
    // サンプル初期データ
    const now = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
    sheet.appendRow([now, 'はるき', 2800, 'sample_1']);
    sheet.appendRow([now, 'ゆい', 2450, 'sample_2']);
    sheet.appendRow([now, 'れん', 1900, 'sample_3']);
  }

  return sheet;
}

function doPost(e) {
  try {
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      return createJsonResponse({ success: false, error: 'No data' });
    }
    
    const action = data.action;
    if (action === 'register') {
      return handleRegister(data);
    }
    if (action === 'bulkRegister') {
      return handleBulkRegister(data);
    }
    if (action === 'saveProgress') {
      return handleSaveProgress(data);
    }
    
    return createJsonResponse({ success: false, error: 'Unknown action' });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

function doGet(e) {
  try {
    const action = (e && e.parameter) ? e.parameter.action : 'getRanking';
    
    if (action === 'init') {
      const ss = getSpreadsheet();
      getOrCreateUnitSheet(ss, '公倍数');
      getOrCreateUnitSheet(ss, '約数');
      getOrCreateProgressSheet(ss);
      return createJsonResponse({ success: true, message: 'シート初期化完了' });
    }

    if (action === 'getSession') {
      const token = new Date().getTime() + "_" + Math.random().toString(36).substring(2);
      return createJsonResponse({ success: true, token: token });
    }
    
    if (action === 'getRanking') {
      const unit = e && e.parameter ? e.parameter.unit : null;
      return handleGetRanking(unit);
    }

    if (action === 'loadProgress') {
      const name = e && e.parameter ? e.parameter.name : null;
      return handleLoadProgress(name);
    }

    if (action === 'getClassProgress') {
      return handleGetClassProgress();
    }
    
    return createJsonResponse({ success: false, error: 'Unknown action' });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

function handleRegister(data) {
  return handleBulkRegister({
    unit: data.unit,
    items: [{
      name: data.name,
      score: data.score,
      token: data.token,
      date: data.date
    }]
  });
}

function handleBulkRegister(data) {
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) {
    return createJsonResponse({ success: false, error: '登録データがありません' });
  }

  const unit = data.unit || (items[0] && items[0].unit) || null;
  
  // 有効な行データを抽出
  const rowsToAdd = [];
  const nowStr = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const name = item.name ? item.name.toString().substring(0, 12) : "名無し";
    const score = parseInt(item.score, 10);
    
    // スコア上限チェックは絶対に設けない
    if (isNaN(score) || score < 0) continue;
    
    const date = item.date || nowStr;
    const token = item.token || "";
    rowsToAdd.push([date, name, score, token]);
  }
  
  if (rowsToAdd.length === 0) {
    return createJsonResponse({ success: false, error: '有効なスコアがありません' });
  }
  
  // 排他制御
  const lock = LockService.getScriptLock();
  if (lock.tryLock(10000)) {
    try {
      const ss = getSpreadsheet();
      const sheet = getOrCreateUnitSheet(ss, unit);
      
      // 一括追加
      const startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, rowsToAdd.length, 4).setValues(rowsToAdd);
      
      // スコア順にソート (ヘッダー除外)
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const range = sheet.getRange(2, 1, lastRow - 1, 4);
        range.sort({ column: 3, ascending: false }); // 3列目降順
      }
      
      return createJsonResponse({ success: true, count: rowsToAdd.length });
    } finally {
      lock.releaseLock();
    }
  } else {
    return createJsonResponse({ success: false, error: 'サーバーが混雑しています' });
  }
}

function handleGetRanking(unit) {
  const ss = getSpreadsheet();
  const sheet = getOrCreateUnitSheet(ss, unit);
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return createJsonResponse({ success: true, data: [] });
  }
  
  const limit = Math.min(lastRow - 1, MAX_RANKING_COUNT);
  const values = sheet.getRange(2, 2, limit, 2).getValues();
  
  const result = values.map(function(row) {
    return { name: row[0], score: row[1] };
  });
  
  return createJsonResponse({ success: true, data: result });
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateProgressSheet(ss) {
  let sheet = ss.getSheetByName('進捗記録');
  if (!sheet) {
    sheet = ss.insertSheet('進捗記録');
    const headers = [['ニックネーム', '累計正解数', '最終プレイ日時', '卵ステージ']];
    sheet.getRange(1, 1, 1, 4).setValues(headers);
    sheet.getRange(1, 1, 1, 4)
      .setBackground('#FFB74D')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 120);
    sheet.setColumnWidth(3, 180);
    sheet.setColumnWidth(4, 150);
  }
  return sheet;
}

function handleSaveProgress(data) {
  const name = data.name ? data.name.toString().substring(0, 12).trim() : "";
  const totalCorrect = parseInt(data.totalCorrect, 10);
  const stageName = data.stageName ? data.stageName.toString().substring(0, 20) : "";

  if (!name || isNaN(totalCorrect) || totalCorrect < 0) {
    return createJsonResponse({ success: false, error: '不正なパラメータです' });
  }

  const lock = LockService.getScriptLock();
  if (lock.tryLock(10000)) {
    try {
      const ss = getSpreadsheet();
      const sheet = getOrCreateProgressSheet(ss);
      const lastRow = sheet.getLastRow();
      const nowStr = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
      
      let foundRow = -1;
      if (lastRow > 1) {
        const names = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < names.length; i++) {
          if (names[i][0] === name) {
            foundRow = i + 2;
            break;
          }
        }
      }

      if (foundRow > 0) {
        const currentVal = parseInt(sheet.getRange(foundRow, 2).getValue(), 10) || 0;
        if (totalCorrect >= currentVal) {
          sheet.getRange(foundRow, 2, 1, 3).setValues([[totalCorrect, nowStr, stageName]]);
        }
      } else {
        sheet.appendRow([name, totalCorrect, nowStr, stageName]);
      }

      return createJsonResponse({ success: true, name: name, totalCorrect: totalCorrect });
    } finally {
      lock.releaseLock();
    }
  } else {
    return createJsonResponse({ success: false, error: 'サーバーが混雑しています' });
  }
}

function handleLoadProgress(name) {
  if (!name) {
    return createJsonResponse({ success: false, error: '名前が指定されていません' });
  }
  const ss = getSpreadsheet();
  const sheet = getOrCreateProgressSheet(ss);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return createJsonResponse({ success: true, exists: false, totalCorrect: 0 });
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === name.trim()) {
      return createJsonResponse({
        success: true,
        exists: true,
        name: values[i][0],
        totalCorrect: values[i][1],
        lastUpdated: values[i][2],
        stageName: values[i][3]
      });
    }
  }

  return createJsonResponse({ success: true, exists: false, totalCorrect: 0 });
}

function handleGetClassProgress() {
  const ss = getSpreadsheet();
  const sheet = getOrCreateProgressSheet(ss);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return createJsonResponse({ success: true, totalParticipants: 0, classTotalCorrect: 0 });
  }

  const values = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  let sum = 0;
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    const val = parseInt(values[i][0], 10);
    if (!isNaN(val)) {
      sum += val;
      count++;
    }
  }

  return createJsonResponse({
    success: true,
    totalParticipants: count,
    classTotalCorrect: sum
  });
}
