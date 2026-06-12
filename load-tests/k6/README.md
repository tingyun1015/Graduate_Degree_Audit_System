# k6 Load Tests

這個資料夾放的是針對目前 FastAPI backend 的 k6 壓測腳本。

## 先決條件

1. 啟動 DB 與 backend
```bash
docker compose down -v
docker compose build backend db-init
docker compose up -d db
docker compose run --rm db-init
docker compose up --build -d backend
```

2. 匯入 repo 內建測試資料
```bash
docker exec -i graduate_audit_db psql -v ON_ERROR_STOP=1 -U postgres -d graduate_audit < scripts/seed_dashboard_test.sql
```

3. 本機安裝 k6 後再執行下面腳本

## 預設測試資料

這些腳本預設對齊 [scripts/seed_dashboard_test.sql](/Users/vincent/Documents/GitHub/Graduate_Degree_Audit_System/scripts/seed_dashboard_test.sql:1)：

- student: `student001@university.edu.tw` / `my_password`
- admin: `admin001@university.edu.tw` / `admin_password`
- student id: `1`
- write test students: `3-15`
- admin user id: `2`
- audit program id: `102`
- admin department id: `1`

如果你的資料不同，可以用環境變數覆蓋。

## 可用環境變數

```bash
BASE_URL=http://localhost:8000
STUDENT_EMAIL=student001@university.edu.tw
STUDENT_PASSWORD=my_password
STUDENT_ID=1
WRITE_STUDENT_BASE_ID=3
AUDIT_PROGRAM_ID=102
PLANNED_PROGRAM_ID=103
PLANNED_COURSE_ID=305
ADMIN_EMAIL=admin001@university.edu.tw
ADMIN_PASSWORD=admin_password
ADMIN_USER_ID=2
ADMIN_DEPT_ID=1
```

## 腳本說明

- `pure-read.js`
  100% 讀取型 workload。只打 student 與 catalog 讀取 API，觀察查詢延遲與吞吐量。
  目前設定大約會送出 3000 個 requests。

- `pure-write.js`
  100% 寫入型 workload。執行 student enrollment / planned course 與 admin program create-publish-delete，並在每輪清理資料。
  每個 VU 固定對應一個不同的 student，避免互相搶同一筆 enrollment 或 planned course。
  目前設定大約會送出 3000 個 requests。

- `read-heavy.js`
  讀多寫少 workload。大部分流量都在 dashboard / audit / programs 讀取，少量穿插 enrollment 寫入與刪除。
  少量寫入同樣採每個 VU 對應不同 student 的方式，降低資料衝突。
  目前設定大約會送出 3000 個 requests。

- `write-heavy.js`
  讀少寫多 workload。以 enrollment、planned course、admin program 建立與刪除為主，只保留少量 dashboard 讀取。
  每個 VU 固定對應一個不同的 student，避免純寫情境下互撞。
  目前設定大約會送出 3000 個 requests。

## 執行範例

```bash
k6 run load-tests/k6/pure-read.js
k6 run load-tests/k6/pure-write.js
k6 run load-tests/k6/read-heavy.js
k6 run load-tests/k6/write-heavy.js
```

帶自訂參數：

```bash
BASE_URL=http://localhost:8000 \
STUDENT_EMAIL=student001@university.edu.tw \
STUDENT_PASSWORD=my_password \
STUDENT_ID=1 \
k6 run load-tests/k6/pure-read.js
```

## 設計上的注意點

- 這個 backend 目前沒有 token/session 機制。`/api/login` 與 `/api/admin/login` 只做資料庫查詢後直接回傳使用者資訊。
- `admin_programs` 路由是靠 query param `user_id` 做管理員判斷，不是 bearer token。
- `admin.py` 內的 `/api/admin/users`、`/api/admin/staff` 目前沒有掛 `require_admin`；這是現況，不是 k6 腳本特別繞過驗證。
- `pure-write.js` 與 `write-heavy.js` 會真的修改資料，請只對測試資料庫執行。
