# Change 005: 匯入 Wizard

## 概述

把分散在 sidebar 的匯入功能（Load JSON / GPX / 上傳底圖）統一成一個 ImportWizard overlay，並加入 AI 教學區，教使用者用 ChatGPT/Claude 生成可匯入的 JSON 檔案。

## 設計決策

### D1: ImportWizard overlay 結構

**方案比較：**

| 方案 | 做法 | 優點 | 缺點 |
|------|------|------|------|
| A. Overlay（推薦） | 跟 ExportPreview 對稱的全螢幕 overlay | UX 一致、焦點清楚 | 多一層 modal |
| B. 獨立路由 | `/import` 頁面 | 可書籤分享 | 需 SPA 路由設定，改動大 |
| C. Sidebar 展開 | sidebar 內部展開 import 區域 | 無 modal | 空間太小放不下 AI 教學 |

**選擇 A。** 跟 ExportPreview 對稱。

**三張功能卡片：**
- 🗺️ 上傳底圖 — 選圖片 → loadImageFile → 關閉 overlay
- 📂 載入專案 — 選 .json → loadProject → 關閉 overlay
- 📥 匯入 GPX — 選 .gpx → importGpxFile → 關閉 overlay

點卡片 → 打開檔案選擇器 → 選檔 → 執行匯入 → 自動關閉 overlay。

**自動關閉機制：** ImportWizard 不直接呼叫 loadProject/importGpxFile/loadImageFile（這些函式內建 file picker）。改為 ImportWizard 自己建立 `<input type="file">` 並在 onchange 中：(1) 呼叫對應的 import 邏輯、(2) 呼叫 `onClose()`。這樣 ImportWizard 完全控制關閉時機。具體：在 ImportWizard 內部實作 `handleUploadBg`、`handleLoadJson`、`handleImportGpx` 三個方法，各自建 input + onchange。

### D2: AI 教學區

**方案比較：**

| 方案 | 做法 | 優點 | 缺點 |
|------|------|------|------|
| A. 輕量（推薦） | 說明文字 + 複製 prompt 按鈕 + 摺疊格式說明 | 簡單不嚇人 | 進階使用者可能想更多 |
| B. 步驟式教學 | 1→2→3→4 引導 | 新手友好 | 佔空間 |
| C. 外部連結 | 連到 README | overlay 乾淨 | 多一步跳轉 |

**選擇 A。** 使用者會用 ChatGPT 的人自己知道怎麼操作。

**AI Prompt 模板：**
```
請幫我製作 TrailPaint 路線地圖的 JSON 檔案。

我的行程：
[在這裡描述你的景點和路線]

JSON 格式要求：
{
  "version": 2,
  "name": "行程名稱",
  "center": [緯度, 經度],
  "zoom": 14,
  "spots": [
    { "id": "s1", "latlng": [緯度, 經度], "num": 1, "title": "景點名", "desc": "描述", "photo": null, "iconId": "pin", "cardOffset": { "x": 0, "y": -60 } }
  ],
  "routes": [
    { "id": "r1", "name": "路線名", "pts": [[緯度,經度], ...], "color": "orange", "elevations": null }
  ]
}

iconId 選項：leaf, flower, tree, bird, water, rock, toilet, bus, rest, food, bike, parking, sun, camera, warning, info, pin
color 選項：orange, blue, green, red, purple
座標請用真實 GPS 座標。每個景點的 cardOffset 請設不同值避免卡片重疊。
```

使用者複製此 prompt → 貼到 ChatGPT/Claude → 描述行程 → AI 生成 JSON → 下載 .json → 回到 TrailPaint 用「載入專案」匯入。

**摺疊格式說明（預設收起）：**
展開後顯示 JSON schema 欄位說明 + iconId 完整列表（含 emoji 預覽）+ color 列表。

### D3: Sidebar 簡化

**Before:**
```
Row 1: [Export] [Save] [Load] [GPX]
Row 2: [Undo] [Redo] [📷 底圖] [↩ 回地圖] [⚙️]
```

**After:**
```
Row 1: [Export] [Save] [Import]
Row 2: [Undo] [Redo] [↩ 回地圖] [⚙️]
```

- Load + GPX + 上傳底圖 合併成 Import（打開 ImportWizard）
- 📷 底圖按鈕從 row 2 移除（統一走 ImportWizard 或拖曳）
- Sidebar props 移除 `onUploadBg`，App.tsx 對應的 callback 也刪除（避免 dead code）
- 拖曳底圖到畫面保留（App.tsx onDrop handler 不動）

### D4: FloatingActions 簡化

**Before:** Export / Save / Load / GPX / Settings
**After:** Export / Save / Import / Settings

Load + GPX 合併成 Import。Props 改為 `onImport: () => void` 取代 `onLoad + onImportGpx`。App.tsx 傳 `onImport={handleOpenImportWizard}`。

### D5: 範例步道

保留在 SpotList 空狀態的下拉選單。不移到 ImportWizard。新手一進來就能看到範例，比進 ImportWizard 更直覺。

## 改動檔案清單

| 檔案 | 變更 |
|------|------|
| `online/src/core/components/ImportWizard.tsx` | 新建：overlay 主體 |
| `online/src/core/components/ImportWizard.css` | 新建：樣式 |
| `online/src/core/components/Sidebar.tsx` | 改：Load/GPX → Import，移除底圖按鈕 |
| `online/src/App.tsx` | 改：ImportWizard overlay state + 傳 callbacks |
| `online/src/core/components/FloatingActions.tsx` | 改：Load/GPX → Import |
| `online/src/i18n/zh-TW.ts` | 改：新 key |
| `online/src/i18n/en.ts` | 改：新 key |
| `online/src/i18n/ja.ts` | 改：新 key |

## i18n 新增 Key 清單

| Key | zh-TW | en | ja |
|-----|-------|----|----|
| `app.import` | 📥 匯入 | 📥 Import | 📥 インポート |
| `import.title` | 匯入你的路線地圖 | Import your trail map | ルートマップをインポート |
| `import.uploadBg` | 上傳底圖 | Upload basemap | 背景画像をアップロード |
| `import.uploadBgDesc` | 選擇截圖或旅遊地圖作為底圖 | Choose a screenshot or travel map as basemap | スクリーンショットや旅行マップを背景に |
| `import.loadJson` | 載入專案 | Load project | プロジェクトを読み込む |
| `import.loadJsonDesc` | 開啟 .trailpaint.json 檔案 | Open a .trailpaint.json file | .trailpaint.json ファイルを開く |
| `import.importGpx` | 匯入 GPX | Import GPX | GPX をインポート |
| `import.importGpxDesc` | 匯入 GPS 軌跡檔 | Import GPS track file | GPS トラックファイルをインポート |
| `import.ai.title` | 🤖 用 AI 製作路線 JSON | 🤖 Create trail JSON with AI | 🤖 AI でルート JSON を作成 |
| `import.ai.desc` | 把行程描述貼給 ChatGPT 或 Claude，它會幫你生成可匯入的 JSON 檔案。 | Paste your trip description to ChatGPT or Claude, it will generate an importable JSON file. | 旅程の説明を ChatGPT や Claude に貼り付けると、インポート可能な JSON ファイルを生成します。 |
| `import.ai.copyPrompt` | 複製提示詞模板 | Copy prompt template | プロンプトテンプレートをコピー |
| `import.ai.promptCopied` | 已複製！ | Copied! | コピーしました！ |
| `import.ai.schemaTitle` | JSON 格式說明 | JSON format reference | JSON フォーマット説明 |
| `import.dragHint` | 或直接拖曳圖片到地圖 | Or drag an image onto the map | または画像を地図にドラッグ |

## 任務拆解

| Task | 內容 | 依賴 |
|------|------|------|
| T1 | 新建 ImportWizard.tsx + .css（三卡片 + AI 教學 + 摺疊格式說明） | — |
| T2 | 改 Sidebar — Load/GPX/底圖 → Import 按鈕 | T1 |
| T3 | 改 App.tsx — ImportWizard overlay state | T1 |
| T4 | 改 FloatingActions — Load/GPX → Import | T1 |
| T5 | i18n 三語 | T1 |
| T6 | Build + 測試 | T1-T5 |

## 風險

1. **Sidebar 按鈕太少**：只剩 Export + Save + Import。但這正好——三個最重要的動作，乾淨。
2. **AI prompt 座標不精確**：AI 生成的 GPS 座標可能有偏差。使用者匯入後可拖動景點調整，不是 blocking issue。
3. **底圖上傳入口變深**：從 sidebar 一鍵 → 要先開 ImportWizard 再點。但拖曳底圖仍是快捷方式。ImportWizard 底圖卡片說明中提及「或直接拖曳圖片」提醒使用者。

## G1 審查修正

Sub-Agent 審查發現 4 個 CRITICAL，已修正：

1. **自動關閉機制**（CRITICAL→修正）：ImportWizard 自建 file input + onchange，完全控制關閉時機。不依賴外部函式的回調。
2. **i18n key 清單不完整**（CRITICAL→修正）：補充完整 14 個新 key 的三語翻譯表。
3. **onUploadBg dead code**（CRITICAL→修正）：Sidebar props 移除 onUploadBg，App.tsx 對應 callback 刪除。
4. **FloatingActions interface 模糊**（CRITICAL→修正）：明確 props 改為 onImport 取代 onLoad+onImportGpx。

另有 1 個 WARNING（拖曳提示文案），已在底圖卡片說明加「或直接拖曳圖片」。
