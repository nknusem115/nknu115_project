# database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# 從環境變數讀取資料庫 URL，如果沒有就用本地 SQLite 作為備用
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fakenews_detector.db")

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
