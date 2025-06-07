# backend/main.py (合併後的最終版本，用於部署到 Render)

# --- 核心依賴 ---
import requests
import time
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

# --- 專案模組 (絕對導入) ---
import crud
import models
import schemas
import security
from database import engine, get_db

# --- 創建資料庫表格 ---
# 這行程式碼會根據 models.py 的定義，在 PostgreSQL 中創建 'users' 表格
try:
    models.Base.metadata.create_all(bind=engine)
    logger.info("資料庫表格檢查/創建完成。")
except Exception as e:
    logger.error(f"創建資料庫表格時失敗: {e}")


# --- 初始化 FastAPI 應用 ---
app = FastAPI(
    title="混合架構新聞檢測 API (指揮中心)",
    description="處理使用者認證，並代理模型預測請求至實驗室伺服器。",
    version="3.0.0",
)


# --- CORS (跨來源資源共享) 配置 ---
# 這裡只允許您的前端訪問，更安全
origins = [
    "http://localhost:5173",  # 您本地開發環境
    # "https://your-deployed-frontend.onrender.com" # 未來部署後的前端網址
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- 使用者認證與依賴 ---
# (這部分與之前帶有資料庫的版本完全相同)
oauth2_scheme = security.OAuth2PasswordBearer(tokenUrl="api/users/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="無法驗證憑證",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = security.jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except security.JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user


# --- API 路由 (Endpoints) ---

# 根路由，用於測試服務是否上線
@app.get("/")
def read_root():
    return {"message": "指揮中心 API 已上線"}

# 使用者註冊路由
@app.post("/api/users/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="此電子郵件已被註冊")
    return crud.create_user(db=db, user=user)

# 使用者登入路由
@app.post("/api/users/login", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="不正確的電子郵件或密碼",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# 獲取當前使用者資訊路由
@app.get("/api/users/me", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user


# --- [核心修改] 模型預測代理路由 ---

# 定義實驗室模型服務的地址
LAB_MODEL_URL = "http://140.127.74.173:8000/predict"

# Pydantic 模型，用於接收前端的請求體
class TextRequest(schemas.BaseModel):
    text: str

@app.post("/api/predict")
async def proxy_predict_news(
    request_data: TextRequest,  # 接收前端發來的 {"text": "..."}
    current_user: schemas.User = Depends(get_current_user) # 保護路由，確保使用者已登入
):
    input_text = request_data.text.strip()
    if not input_text:
        raise HTTPException(status_code=400, detail="輸入內容不可為空")

    logger.info(f"使用者 {current_user.email} 請求分析，轉發至實驗室伺服器: {LAB_MODEL_URL}")
    start_time = time.time()

    try:
        # 將請求轉發到實驗室的模型服務
        # 注意：這裡我們將 TextRequest 的 'text' 欄位，包裝成實驗室伺服器期待的 'content' 欄位
        response = requests.post(
            LAB_MODEL_URL,
            json={"content": input_text},  # <-- 重要：匹配實驗室後端的 NewsRequest(content: str)
            timeout=30
        )
        response.raise_for_status() # 如果實驗室伺服器回傳 4xx 或 5xx 錯誤，這裡會拋出異常

        # 實驗室伺服器回傳的格式是 {"label": 0/1, "confidence": 0.98}
        lab_result = response.json()
        
        # 將數字標籤轉換為前端期望的字串標籤 "真" 或 "假"
        # 假設 0 代表假，1 代表真 (您需要和同學確認這個對應關係)
        prediction_label = "真" if lab_result.get("label") == 1 else "假"

        duration = round((time.time() - start_time) * 1000, 2)
        logger.info(f"從實驗室收到回應，原始標籤: {lab_result.get('label')}, 轉換後標籤: {prediction_label}, 總耗時: {duration}ms")

        # 回傳前端期望的格式 {"label": "真/假"}
        return {"label": prediction_label}

    except requests.exceptions.Timeout:
        logger.error("請求實驗室模型服務超時")
        raise HTTPException(status_code=504, detail="模型服務響應超時，請稍後再試")
    except requests.exceptions.RequestException as e:
        logger.error(f"無法連接至實驗室模型服務: {e}")
        raise HTTPException(status_code=503, detail="無法連接至後端模型服務")