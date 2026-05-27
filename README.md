# Graduate_Degree_Audit_System

Verifying academic requirements for graduation.

## Project Structure

```text
.
├── backend
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app
│       ├── __init__.py
│       ├── database.py
│       ├── main.py
│       └── models.py
└── docker-compose.yml
```

## Run

```bash
# 以下擇一使用
# 用新版的 BuildKit image fetch (可能會失敗)
docker compose up --build -d
# 使用舊版 Docker daemon 直接拉取
DOCKER_BUILDKIT=0 docker compose up --build -d
```

## get schema

```bash
# 查看所有 table
docker exec graduate_audit_db psql -U postgres -d graduate_audit -c "\dt"
# 查看 takes table
docker exec graduate_audit_db psql -U postgres -d graduate_audit -c "\d takes"
# 查看所有 table 的欄位結構
docker exec graduate_audit_db psql -U postgres -d graduate_audit -c "\d+"
```

## Endpoints

- `GET /`
- `GET /health`
