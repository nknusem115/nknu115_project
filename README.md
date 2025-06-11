# __真相守門員 - AI 假新聞檢測平台__
### 真相守門員 (Truth Guardian) 是一個全端應用程式，旨在利用人工智慧技術幫助使用者辨識和分析可疑的新聞內容。它採用了現代化的前後端分離架構，提供流暢的使用者體驗和穩健的後端服務

![alt text](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)

![alt text](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)

![alt text](https://img.shields.io/badge/SQLAlchemy-D71F00?logo=sqlalchemy&logoColor=white)

![alt text](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)

![alt text](https://img.shields.io/badge/TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white)

## 核心功能

__使用者認證系統__：支援安全的電子郵件/密碼註冊與登入，使用 JWT (JSON Web Tokens) 進行會話管理

__AI 驅動的短文檢測__：登入後，使用者可提交文本內容，系統將透過後端 AI 模型進行分析，判斷其為真實或虛假新聞的可能性

__詳細的分析報告__：針對每次檢測，前端會生成一份視覺化的報告，包含假新聞機率、風險等級、信心度及專業建議__(未完成)__

__個人化檢測歷史__：系統會儲存每位使用者最近的檢測記錄，方便回溯與查看

__統計數據儀表板__：一個靜態頁面，展示系統整體的檢測效能指標（未來可擴充為動態圖表）

__媒體素養教育中心__：提供實用的指南和外部查證資源，幫助使用者提升辨識假新聞的能力



## 系統架構

__本專案採用「混合式架構」，將使用者管理與模型預測服務解耦，以提升系統的安全性、可擴展性和可維護性__

graph TD
    A[使用者 Browser] --> B{前端應用 (React)};
    B --> C{後端指揮中心 (FastAPI)};
    C -- 使用 SQLAlchemy 操作 --> D[(SQLite 資料庫)];
    C -- 轉發請求 --> E{後端實驗室伺服器 (AI 模型)};
    E -- 回傳預測結果 --> C;
    C -- 處理後回傳 --> B;

    subgraph 前端 (Frontend)
        B
    end

    subgraph 後端 (Backend)
        C
        D
    end

    subgraph 實驗室 (Lab)
        E
    end

## 前端應用 (React)：

1.運行於使用者的瀏覽器

2.負責所有 UI 介面渲染與互動

3.所有對後端的請求只會發送到「後端指揮中心」

## 後端指揮中心 (FastAPI)：

本專案提供的 FastAPI 後端

核心職責：處理使用者註冊、登入、身份驗證

作為一個安全的代理 (Proxy)，它接收到前端的分析請求後，會先驗證使用者身份，然後再將請求轉發到「實驗室伺服器」

透過 SQLAlchemy ORM 來操作SQLite 資料庫，以存儲使用者資料

## 後端實驗室伺服器 (AI 模型)：

一個獨立的、專門運行機器學習模型的伺服器 (URL: http://140.127.74.173:8000/predict)
它不處理使用者身份驗證，只專注於接收文本並回傳分析結果

__此架構使模型可以獨立更新和擴展，而不影響主應用程式__

## 技術棧

__類別	技術	說明__

前端	React.js, Vite, Tailwind CSS, lucide-react	構建現代化的使用者介面與互動體驗

後端	FastAPI, Python 3.9+	高效能的非同步 Web 框架

資料庫	 SQLite 	

ORM	SQLAlchemy	物件關聯對映工具，讓我們用 Python 物件操作資料庫，而非手寫 SQL

認證	JWT, Passlib	用於使用者身份驗證與密碼安全

API	Pydantic, RESTful API	用於資料驗證和定義 API 結構

## 專案結構

truth-guardian/

├── backend/

│   ├── crud.py   # 資料庫增刪改查操作 (使用 SQLAlchemy)

│   ├── database.py       # 資料庫連線設定 (使用 SQLAlchemy)

│   ├── main.py           # FastAPI 應用主程式

│   ├── models.py         # SQLAlchemy 資料庫模型

│   ├── schemas.py        # Pydantic 資料結構模型

│   ├── security.py       # 密碼與 JWT 安全相關函數

│   ├── .env.example      # 環境變數範本

│   └── requirements.txt  # Python 依賴

│

└── frontend/               # <--- Vite 專案根目錄

    ├── public/             # 公共靜態資源目錄 (例如 favicon.ico, images)
    
    ├── src/                # 原始碼目錄
    
    │   └── App.jsx         # React 主應用程式組件
    
    ├── .gitignore          # Git 忽略清單
    
    ├── index.html          # 應用程式的進入點 HTML
    
    ├── package.json        # 專案依賴與腳本設定
    
    └── vite.config.js      # Vite 專案設定檔
    
# 安裝與啟動指南

__前置需求__

Node.js (v18 或更高版本)

Python (v3.9 或更高版本)

Git

## 1. 後端設定 (FastAPI)

 ### 1. 克隆專案
    
```git clone <your-repository-url>```
```cd truth-guardian/backend```

### 2. 創建並激活 Python 虛擬環境

```python -m venv venv```
 Windows: venv\Scripts\activate
 macOS / Linux: source venv/bin/activate

### 3. 安裝依賴

```pip install -r requirements.txt```

### 4. 設定環境變數

#### 複製範本文件
```cp .env.example .env```

 編輯 .env 文件，填入你的設定。
 DATABASE_URL 指定了 SQLAlchemy 將要連接的【實際資料庫】。
 本地開發時，使用簡單的 SQLite；生產環境則換成 PostgreSQL 連線字串。
 --- .env ---
 SECRET_KEY="your-super-secret-key-generated-by-openssl"
 ALGORITHM="HS256"
 ACCESS_TOKEN_EXPIRE_MINUTES=30
 DATABASE_URL="sqlite:///./fakenews_detector.db"
 ------------

### 5. 啟動後端伺服器 (預設運行在 http://127.0.0.1:8000)
```uvicorn main:app --reload```

## 2. 前端設定 (React)
   
### 1. 開啟新的終端，進入前端目錄
```cd ../frontend```

### 2. 安裝依賴
```npm install```

### 3. __[重要]__ 確認 API 端點
 打開 `src/App.jsx` 文件，搜尋所有 `fetch` 函數
 確保 URL 指向你的後端伺服器。本地開發時應為 "http://127.0.0.1:8000"
 注意：main.py 的 API 路由有 /api 前綴，請確保前端請求路徑與後端路由完全匹配(predict 例外)
 例如：/api/users/login, /api/users/register, /predict

# 4. 啟動前端開發伺服器 (預設運行在 http://localhost:5173)

```npm run dev```

## 現在，您可以在瀏覽器中打開 http://localhost:5173 來使用本應用程式

__API 端點 (後端指揮中心)__
__方法	路徑	描述	認證__
POST	/api/users/register	註冊新使用者	無
POST	/api/users/login	使用者登入並取得 JWT Token	無
GET	    /api/users/me	獲取當前登入使用者的資訊	需要
POST	/predict	代理新聞分析請求至實驗室伺服器	需要
GET	   /	檢查 API 服務是否上線	無
