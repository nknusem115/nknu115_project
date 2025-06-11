# --- 核心依賴 (合併兩者的需求) ---
import time
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import traceback
import os
import torch
from transformers import AutoConfig,BertTokenizer, RobertaForSequenceClassification

# --- 專案模組 (使用者系統) ---
import crud
import models
import schemas
import security
from database import engine, get_db

# --- 創建資料庫表格 ---
# 這將在實驗室伺服器的 backend 目錄下創建一個 fakenews_detector.db 檔案
try:
    models.Base.metadata.create_all(bind=engine)
    logger.info("資料庫表格檢查/創建完成。")
except Exception as e:
    logger.error(f"創建資料庫表格時失敗: {e}")

# --- 初始化 FastAPI 應用 ---
app = FastAPI(
    title="全功能假新聞檢測 API (實驗室版)",
    description="處理使用者認證與本地模型預測。",
    version="4.0.0 (Final)",
)

# --- CORS (跨來源資源共享) 配置 ---
origins = [
    "http://localhost:5173",  # 允許您本地的 React 開發伺服器
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- [核心合併 1] 在應用啟動時加載模型 ---
try:
    logger.info("正在加載模型，請稍候...")  
    # 確保這個路徑在實驗室伺服器上是正確的！
    # 例如，模型資料夾與 main.py 在同一目錄下
    tokenizer = BertTokenizer.from_pretrained("bert-base-chinese")
    model_path = r"C:\Users\user\Desktop\Model_API\app\backend\model_dir"
    model = RobertaForSequenceClassification.from_pretrained(model_path,local_files_only=True)
    model.eval()
    logger.info("模型加載成功！")
except Exception as e:
    logger.error(f"模型加載失敗: {e}")
    # 在實際生產中，如果模型加載失敗，可能需要讓應用程式退出
    # raise e 
    logger.error(f"錯誤訊息: {str(e)}")
    logger.error("完整錯誤追蹤：")
    logger.error(traceback.format_exc())

# --- 使用者認證與依賴 (從指揮中心版本複製) ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/login")

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

# 根路由
@app.get("/")
def read_root():
    return {"message": "全功能假新聞檢測 API 已上線"}

# --- 使用者系統路由 ---
@app.post("/api/users/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="此電子郵件已被註冊")
    return crud.create_user(db=db, user=user)

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

@app.get("/api/users/me", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user

# --- [核心合併 2] 模型預測路由 ---

# Pydantic 模型，用於接收前端的請求體
class TextRequest(schemas.BaseModel):
    text: str

@app.post("/predict")
async def predict_news(
    request_data: TextRequest,  # 接收前端發來的 {"text": "..."}
    current_user: schemas.User = Depends(get_current_user) # 保護路由，需要登入
):
    input_text = request_data.text.strip()
    if not input_text:
        raise HTTPException(status_code=400, detail="輸入內容不可為空")

    logger.info(f"使用者 {current_user.email} 請求分析，內容: '{input_text[:30]}...'")
    start_time = time.time()

    # 使用全局加載的模型進行預測
    try:
        inputs = tokenizer(input_text, return_tensors="pt", truncation=True, max_length=512, padding=True)
        with torch.no_grad():
            outputs = model(**inputs)
            label_index = int(torch.argmax(outputs.logits, dim=1))
        
        # 將數字標籤轉換為前端期望的字串標籤 "真" 或 "假"
        # !!! 請務必與同學確認這個對應關係 !!!
        # 假設 0 代表假 (Fake), 1 代表真 (Real)
        final_label = "真" if label_index == 1 else "假"

        duration = round((time.time() - start_time) * 1000, 2)
        logger.info(f"預測完成。標籤: {final_label} (原始: {label_index}), 耗時: {duration}ms")

        # 回傳前端期望的格式 {"label": "真/假"}
        return {"label": final_label}
        
    except Exception as e:
        logger.error(f"模型預測時發生錯誤: {e}")
        raise HTTPException(status_code=500, detail="模型在進行預測時發生內部錯誤。")
