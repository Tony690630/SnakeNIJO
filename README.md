# 🎮 多功能極簡貪食蛇 - GitHub Pages 部署指南

這款遊戲已經配置好了 **GitHub Actions** 與 **Vite 相對路徑**！只要將本專案匯出並上傳到您的 GitHub 儲存庫（Repository），GitHub 就會自動幫您將遊戲部署並發布到網路上，讓所有人都能直接點開網址來玩！

---

## 🚀 部署步驟教學

### 第一步：從 Google AI Studio 匯出專案
1. 點擊 AI Studio 網頁右上角的 **「設定 (Settings)」** 齒輪圖示 ⚙️。
2. 選擇 **「Export to GitHub」** 或是 **「Download ZIP」**。
   - 如果選擇 **Export to GitHub**：直接將此專案連結並推送到您新增的 GitHub 儲存庫即可！
   - 如果選擇 **Download ZIP**：下載壓縮檔並在電腦解壓縮後，使用 Git 將檔案上傳到您的 GitHub。

### 第二步：啟用 GitHub Pages 部署來源
1. 進入您在 GitHub 的專案頁面。
2. 點擊上方的 **Settings (設定)** 頁籤。
3. 在左側選單中找到 **Pages**。
4. 在 **Build and deployment** 底下的 **Source** 選擇：
   - **GitHub Actions** (重要！請選這個，因為我們已經為您寫好自動化部署腳本了)。
   
> 💡 *設定完成後，只要您將程式碼推送到 `main` 或 `master` 分支，GitHub Actions 就會自動執行建置並發布網站！*

### 第三步：查看部署進度與遊玩！
1. 點擊 GitHub 專案上方的 **Actions** 頁籤。
2. 您會看到一個名為 **Deploy to GitHub Pages** 的工作正在執行。
3. 綠色打勾完成後，點進該工作流程，就能看到您專屬的 **GitHub Pages 網址**。點開即可開始暢玩！

---

## 🛠️ 本地開發與手動建置 (選填)

如果您想在自己的電腦上執行或手動打包：

### 1. 安裝套件
```bash
npm install
```

### 2. 開啟本地測試伺服器
```bash
npm run dev
```

### 3. 手動打包
```bash
npm run build
```
打包後的靜態檔案會產出在 `/dist` 資料夾中。
