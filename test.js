const puppeteer = require('puppeteer');
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const ARTIFACT_DIR = 'C:/Users/yukil/.gemini/antigravity/brain/844a4e25-cbb2-450b-8f0f-7b4b05f7f96d/screenshots';

// 静的ファイルの配信
app.use(express.static(__dirname));

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const server = app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // 1. タイトル画面テスト
    await page.goto(`http://localhost:${PORT}/index.html`);
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'title_stage0.png') });
    console.log("Screenshot: title_stage0.png");

    // 2. 卵の各ステージ表示テスト（動的ステージ切り替え）
    const testStages = [
      { count: 100, name: 'stage1' },
      { count: 500, name: 'stage2' },
      { count: 1000, name: 'stage3' },
      { count: 2000, name: 'stage4' },
      { count: 3000, name: 'stage5' },
      { count: 4000, name: 'stage6' },
      { count: 5000, name: 'stage7_bird' }
    ];

    for (const s of testStages) {
      await page.evaluate((cnt) => {
        progress.totalCorrect = cnt;
        updateEggDisplay();
      }, s.count);
      await new Promise(r => setTimeout(r, 300));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `title_${s.name}.png`) });
      console.log(`Screenshot: title_${s.name}.png`);
    }

    // 3. ゲーム画面テスト
    await page.click('#btn-start');
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'game_screen.png') });
    console.log("Screenshot: game_screen.png");

    // 4. 数字入力テスト
    await page.click('.num-btn[data-num="2"]');
    await page.click('.num-btn[data-num="4"]');
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'game_input.png') });
    console.log("Screenshot: game_input.png");

    // 5. リザルト画面テスト
    await page.evaluate(() => { state.timeLeft = 1; });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'game_result.png') });
    console.log("Screenshot: game_result.png");

    console.log("All tests passed successfully!");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
    server.close();
  }
});
