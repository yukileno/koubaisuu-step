/**
 * 算数学習Webアプリ「公倍数ステップ」
 * 単一シート「公倍数」一元管理バックエンド
 * ランキング・進捗記録・引継ぎをすべて「公倍数」シートのみで管理
 */

const MAIN_SHEET_NAME = '公倍数';
const MAX_RANKING_COUNT = 20;

/**
 * 統合スプレッドシートを取得
 */
function getSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  let sheetId = props.getProperty('SPREADSHEET_ID') || '1mEh0lkapIp-UmHJ2_dLaAzk9I1h9q--_3EoK59CVo1w';
  return SpreadsheetApp.openById(sheetId);
}

/**
 * 「公倍数」シートを取得（ヘッダー: 日時, ニックネーム, せいかい数, たまごステージ）
 */
function getOrCreateMainSheet(ss) {
  let sheet = ss.getSheetByName(MAIN_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.getSheetByName('Ranking');
    if (sheet) {
      sheet.setName(MAIN_SHEET_NAME);
    }
  }

  if (!sheet) {
    sheet = ss.insertSheet(MAIN_SHEET_NAME);
  }

  // ヘッダー行が存在しないか空ならセット
  if (sheet.getRange(1, 1).getValue() === '') {
    const headers = [['日時', 'ニックネーム', 'せいかい数', 'たまごステージ']];
    sheet.getRange(1, 1, 1, 4).setValues(headers);
    sheet.getRange(1, 1, 1, 4)
      .setBackground('#FF7675')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 170);
    sheet.setColumnWidth(2, 150);
    sheet.setColumnWidth(3, 110);
    sheet.setColumnWidth(4, 160);
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
    if (action === 'register' || action === 'bulkRegister') {
      return handleRegister(data);
    }
    if (action === 'saveProgress') {
      return handleSaveProgress(data);
    }
    if (action === 'resetRanking') {
      return handleResetRanking();
    }
    
    return createJsonResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

function doGet(e) {
  try {
    const action = (e && e.parameter) ? e.parameter.action : 'getRanking';
    
    if (action === 'init') {
      const ss = getSpreadsheet();
      getOrCreateMainSheet(ss);
      return createJsonResponse({ success: true, message: '公倍数シート初期化完了' });
    }

    if (action === 'resetRanking') {
      return handleResetRanking();
    }

    if (action === 'getSession') {
      const token = new Date().getTime() + "_" + Math.random().toString(36).substring(2);
      return createJsonResponse({ success: true, token: token });
    }
    
    if (action === 'getRanking') {
      return handleGetRanking();
    }

    if (action === 'loadProgress') {
      const name = e && e.parameter ? e.parameter.name : null;
      return handleLoadProgress(name);
    }
    
    return createJsonResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * せいかい数ランキング登録 / 更新（UPSERT: 1人1行でベスト正解数を保持）
 */
function handleRegister(data) {
  let name = "";
  let score = 0;
  let stageName = "";

  if (data.items && Array.isArray(data.items) && data.items.length > 0) {
    name = data.items[0].name;
    score = parseInt(data.items[0].score, 10);
    stageName = data.items[0].stageName || "";
  } else {
    name = data.name;
    score = parseInt(data.score, 10);
    stageName = data.stageName || "";
  }

  return saveOrUpdateScore(name, score, stageName);
}

/**
 * 進捗保存（saveProgress）
 */
function handleSaveProgress(data) {
  const name = data.name;
  const totalCorrect = parseInt(data.totalCorrect, 10);
  const stageName = data.stageName || "";
  return saveOrUpdateScore(name, totalCorrect, stageName);
}

/**
 * 「公倍数」シートへの共通UPSERT処理
 */
function saveOrUpdateScore(name, score, stageName) {
  const cleanName = name ? name.toString().substring(0, 12).trim() : "";
  const validScore = parseInt(score, 10);

  if (!cleanName || isNaN(validScore) || validScore < 0) {
    return createJsonResponse({ success: false, error: '不正なパラメータです' });
  }

  const lock = LockService.getScriptLock();
  if (lock.tryLock(10000)) {
    try {
      const ss = getSpreadsheet();
      const sheet = getOrCreateMainSheet(ss);
      const lastRow = sheet.getLastRow();
      const nowStr = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
      const cleanStage = stageName ? stageName.toString().substring(0, 30).trim() : "";

      let foundRow = -1;
      if (lastRow > 1) {
        const names = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
        for (let r = 0; r < names.length; r++) {
          if (names[r][0] === cleanName) {
            foundRow = r + 2;
            break;
          }
        }
      }

      if (foundRow > 0) {
        const currentScore = parseInt(sheet.getRange(foundRow, 3).getValue(), 10) || 0;
        if (validScore >= currentScore) {
          sheet.getRange(foundRow, 1, 1, 4).setValues([[nowStr, cleanName, validScore, cleanStage]]);
        }
      } else {
        sheet.appendRow([nowStr, cleanName, validScore, cleanStage]);
      }

      // せいかい数順にソート (ヘッダー除外, 3列目降順)
      const newLastRow = sheet.getLastRow();
      if (newLastRow > 1) {
        sheet.getRange(2, 1, newLastRow - 1, 4).sort({ column: 3, ascending: false });
      }

      return createJsonResponse({ 
        success: true, 
        name: cleanName, 
        score: validScore,
        stageName: cleanStage 
      });
    } finally {
      lock.releaseLock();
    }
  } else {
    return createJsonResponse({ success: false, error: 'サーバーが混雑しています' });
  }
}

/**
 * せいかい数ランキングTop 20取得
 */
function handleGetRanking() {
  const ss = getSpreadsheet();
  const sheet = getOrCreateMainSheet(ss);
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return createJsonResponse({ success: true, data: [] });
  }
  
  const limit = Math.min(lastRow - 1, MAX_RANKING_COUNT);
  const values = sheet.getRange(2, 2, limit, 3).getValues();
  
  const result = values.map(function(row) {
    return { 
      name: row[0], 
      score: row[1],
      stage: row[2]
    };
  });
  
  return createJsonResponse({ success: true, data: result });
}

/**
 * 進捗読み込み（loadProgress）: 「公倍数」シートから検索
 */
function handleLoadProgress(name) {
  if (!name) {
    return createJsonResponse({ success: false, error: '名前が指定されていません' });
  }
  const cleanName = name.trim();
  const ss = getSpreadsheet();
  const sheet = getOrCreateMainSheet(ss);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return createJsonResponse({ success: true, exists: false, totalCorrect: 0 });
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  for (let i = 0; i < values.length; i++) {
    if (values[i][1] === cleanName) {
      return createJsonResponse({
        success: true,
        exists: true,
        name: values[i][1],
        totalCorrect: values[i][2],
        lastUpdated: values[i][0],
        stageName: values[i][3]
      });
    }
  }

  return createJsonResponse({ success: true, exists: false, totalCorrect: 0 });
}

/**
 * ランキング数値リセット: 「公倍数」シートのデータ行を削除
 */
function handleResetRanking() {
  const ss = getSpreadsheet();
  const sheet = getOrCreateMainSheet(ss);
  
  const lock = LockService.getScriptLock();
  if (lock.tryLock(10000)) {
    try {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      sheet.getRange(1, 1, 1, 4).setValues([['日時', 'ニックネーム', 'せいかい数', 'たまごステージ']]);
      sheet.getRange(1, 1, 1, 4)
        .setBackground('#FF7675')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold')
        .setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(1, 170);
      sheet.setColumnWidth(2, 150);
      sheet.setColumnWidth(3, 110);
      sheet.setColumnWidth(4, 160);
      
      return createJsonResponse({ success: true, message: '公倍数シートのランキングをリセットしました' });
    } finally {
      lock.releaseLock();
    }
  } else {
    return createJsonResponse({ success: false, error: 'サーバーが混雑しています' });
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
