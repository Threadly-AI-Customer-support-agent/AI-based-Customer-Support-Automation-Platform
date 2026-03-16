import pymysql
from database import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

def init_db():
    print(f"Connecting to MySQL at {DB_HOST}...")
    try:
        # Connect to MySQL Server (no specific DB yet)
        connection = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD
        )
        
        with connection.cursor() as cursor:
            # Create the database if it doesn't exist
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
            print(f"✅ Database '{DB_NAME}' checked/created successfully.")
            
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

if __name__ == "__main__":
    init_db()