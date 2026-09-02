const puppeteer = require('puppeteer');
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const ARTIFACT_DIR = 'C:/Users/yukil/.gemini/antigravity/brain/b0f0d24d-0970-491f-b33f-450941e28fb9/screenshots';

// 静的ファイルの配信
app.use(express.static(__dirname));

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const server = app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
  
  const browser = await puppeteer.launch({ headless: true });
  
  try {
    const page = await browser.newPage();
    
    // 画面サイズテスト
    const sizes = [
      { width: 1280, height: 720, name: '1280x720' },
      { width: 1366, height: 768, name: '1366x768' },
      { width: 1920, height: 1080, name: '1920x1080' }
    ];

    for (const size of sizes) {
      await page.setViewport({ width: size.width, height: size.height });
      await page.goto(`http://localhost:${PORT}/index.html`);
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `title_${size.name}.png`) });
    }

    // 基本解像度でゲームテスト
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(`http://localhost:${PORT}/index.html`);
    
    // 1. スタート
    await page.click('#btn-start');
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'game_start.png') });
    
    console.log("Game started. Proceeding with tests...");
    
    // このテストでは、何問か適当にボタンを押して動作確認する
    // 問題の正解はDOMから読み取れないが（設計上JS内）、適当な数字を入れてクリアボタンを押すなどのテストをする
    await page.click('.num-btn[data-num="1"]');
    await page.click('.num-btn[data-num="2"]');
    await page.click('#btn-submit');
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'game_input.png') });
    
    // タイマーを強制終了させてリザルト画面を見る
    await page.evaluate(() => { state.timeLeft = 1; });
    await new Promise(r => setTimeout(r, 2000));
    
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'game_result.png') });
    
    // ランキング登録
    await page.type('#nickname', 'テスト太郎');
    await page.click('#btn-register');
    await new Promise(r => setTimeout(r, 1500)); // モック通信待機
    
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'game_ranking.png') });
    
    console.log("All tests completed successfully.");
    
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
    server.close();
  }
});
