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
docker compose up --build
```

## Endpoints

- `GET /`
- `GET /health`
