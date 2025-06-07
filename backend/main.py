# main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
import requests
from jose import JWTError, jwt

# Import our new modules
import crud, models, schemas, security
from database import engine, get_db

# This command creates the database file and the 'users' table if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    version="2.0.0",
)

# --- CORS Middleware ---
origins = [
         
    "http://localhost:5173",    # Vite 開發服務器 (您目前使用的)
    "http://127.0.0.1:5173",
    
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # 確保 'POST' 在允許範圍內
    allow_headers=["*"],# 確保 'Content-Type' 在允許範圍內
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/login")

# --- Dependency for getting current user ---
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

# --- User & Auth Endpoints ---
@app.post("/api/users/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/api/users/login", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username) # form uses 'username' for email
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user

# --- Prediction Endpoint (Now Protected) ---
EXTERNAL_API_URL = "http://140.127.74.173:8000/predict"

class TextRequest(schemas.BaseModel):
    text: str

@app.post("/api/predict")
async def proxy_predict_news(
    request: TextRequest,
    current_user: schemas.User = Depends(get_current_user) # This line protects the endpoint
):
    input_text = request.text.strip()
    if not input_text:
        raise HTTPException(status_code=400, detail="輸入內容不可為空")

    try:
        response = requests.post(EXTERNAL_API_URL, json={"text": input_text}, timeout=15)
        response.raise_for_status()
        prediction_result = response.json()
        
        # Adapt based on the external API's actual response key
        final_label = prediction_result.get("prediction") or prediction_result.get("label")
        if final_label is None:
            raise HTTPException(status_code=500, detail="外部 API 回傳格式不符預期")

        return {"label": final_label}
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="模型服務響應超時")
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=503, detail="無法連接至後端模型服務")