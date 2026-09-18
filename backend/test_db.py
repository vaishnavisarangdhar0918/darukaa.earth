
from sqlalchemy import text
from database import engine

try:
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT PostGIS_Version()")
        )

        print("Database connected successfully!")
        print("PostGIS version:", result.scalar())

except Exception as error:
    print("Database connection failed:")
    print(error)