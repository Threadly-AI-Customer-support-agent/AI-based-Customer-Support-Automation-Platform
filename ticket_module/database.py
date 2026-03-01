from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# --- CONFIGURATION ---
DB_USER = "root"
DB_PASSWORD = "NewPassword123"
DB_HOST = "localhost"
DB_PORT = "3306"
DB_NAME = "ticket_db"

# Connection String
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Create the Engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create SessionLocal class (used to create a database session for each request)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()