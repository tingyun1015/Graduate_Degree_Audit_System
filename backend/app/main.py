from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import HealthRecord


app = FastAPI(title="Graduate Degree Audit System API")


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/")
def read_root():
    return {"message": "Graduate Degree Audit System backend is running"}


@app.get("/health")
def read_health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    record = db.query(HealthRecord).first()

    if record is None:
        record = HealthRecord(message="Database connected")
        db.add(record)
        db.commit()
        db.refresh(record)

    return {
        "status": "ok",
        "database": "connected",
        "record_id": record.id,
        "message": record.message,
    }
