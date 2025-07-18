# 🍰 多巴胺甜點工作室 - Dopamine Cake Store

本專案為**前後端分離**的線上蛋糕訂購系統，後端採用 **Golang Gin 框架**，前端使用 **原生 HTML、CSS、JavaScript** 開發。  
伺服器架設於 **AWS EC2**，透過 **Docker 與 Docker Compose 容器化部署**，全站 API 串接採用 **GraphQL**。  
同時透過 **AWS Route 53 申請網域**，使用 **Nginx 反向代理與 HTTPS 憑證申請 (Let's Encrypt)** 進行流量導向與加密。

功能提供：**商品瀏覽、購物車下單、會員管理、後台訂單管理、訂單匯出 Excel**。

🔗 網站連結：[https://dopamineforu.com/](https://dopamineforu.com/)

---

## 🔧 使用技術與架構

| 分類              | 技術 / 工具                     | 說明 |
| ----------------- | ------------------------------- | ---------------------------------------- |
| **後端**          | Golang + Gin                    | REST 路由整合 **GraphQL API**（全站資料操作） |
|                   | GraphQL                         | **無 Codegen，自行撰寫 Resolver 與 Schema** |
|                   | PostgreSQL                      | 會員、商品、訂單資料儲存 |
|                   | JWT                             | 會員驗證，支援多角色（Admin / User） |
|                   | Excelize                        | 後台訂單匯出 Excel（支援月份篩選） |
| **前端**          | HTML / CSS / JavaScript         | **純原生語法撰寫**，無框架 |
| **部署與運維**     | Nginx                           | 前端靜態檔案服務，並進行反向代理 |
|                   | Docker / Docker Compose         | 容器化部署，拆分前端、後端、資料庫微服務 |
|                   | AWS EC2                         | 雲端主機部署 |
|                   | AWS Route 53 + Let's Encrypt    | 申請自有網域，導入 HTTPS 加密 |
|                   | GitHub Actions（CI/CD）         | 自動化部署：`git pull origin main` → 清除 AWS EC2 舊容器 → `docker-compose up -d --build` 完成容器重建與部署 |

---

## 📦 功能介紹

### 🛍️ 顧客功能（前台）

- 商品瀏覽、加入購物車  
- 訂單提交（宅配 / 面交）
- 會員註冊 / 登入（JWT 驗證）
- 會員專區：查看訂單歷史（時間、狀態、商品明細）

### 🛠️ 商店主功能（後台）

- 管理所有訂單（狀態切換：等待接收 → 等待付款 → 製作中 → 完成）
- 新增商品（透過 `delivery.html` 操作）
- 訂單 Excel 匯出（支援月份篩選）

---

## 🗂️ 專案目錄結構

### 後端（backend/）
```
backend/
├── main.go       // 入口主程式
├── database/     // DB 初始化
├── graph/        // GraphQL Schema / Resolver
├── models/       // 資料結構（User/Product/Order）
├── middlewares/  // JWT 驗證
├── handlers/     // 訂單匯出 Excel
├── routes/       // 路由註冊
```

### 前端（frontend/）

```
frontend/
├── index.html     // 首頁（商品瀏覽）
├── delivery.html  // 商品專區（支援新增商品功能）
├── cart.html      // 購物車（宅配 / 面交選擇）
├── register.html  // 會員註冊
├── login.html     // 會員登入（JWT 儲存於 localStorage）
├── member.html    // 會員專區（顧客 / 商店主雙畫面）
├── notice.html    // 訂購須知
├── flow.html      // 購物流程
├── policy.html    // 退換貨政策
├── instagram.html // Instagram 社群頁
├── line.html      // Line 聯絡頁
├── assets/        // CSS、JS、圖片資源
```

## ⚙️ 系統架構

### 🔗 API 設計（GraphQL）

| API                     | 說明                        |
| ---------------------- | --------------------------- |
| `register`              | 會員註冊                    |
| `login`                 | 登入（回傳 JWT）            |
| `meInfo`                | 查詢個人會員資訊             |
| `products`              | 查詢所有商品                 |
| `createProduct`         | 新增商品（僅 Admin 可用）    |
| `createOrder`           | 建立訂單                     |
| `myOrders`              | 查詢個人訂單（顧客）         |
| `allOrders`             | 查詢所有訂單（管理員）       |
| `updateOrderStatus`     | 更新訂單狀態                 |
| `/admin/exportOrders`   | 匯出訂單 Excel（支援月份）   |

---

---

## 🗄️ 資料庫設計（PostgreSQL）

| Table          | 說明                |
| -------------- | ------------------- |
| `users`        | 會員資料（含 admin） |
| `products`     | 商品資料（蛋糕）    |
| `orders`       | 訂單主表            |
| `order_items`  | 訂單明細            |

---

## 🚀 快速啟動（Docker）

請先確認已安裝 Docker 與 Docker Compose。

```bash
docker-compose up -d --build
```

| 服務              | 說明                       |
| --------------- | ------------------------ |
| `cake_backend`  | Golang Gin + GraphQL API |
| `cake_frontend` | Nginx + 前端靜態頁面           |
| `db`            | PostgreSQL 資料庫           |

## 🌟 系統亮點

- **全站 GraphQL API**  
  自行撰寫 Schema 與 Resolver，**無套件自動生成（非 Codegen）**，掌握完整 API 設計流程。

- **JWT 認證、角色權限分流（Admin / User）**  
  系統自帶角色控管，介面功能依身份動態切換。

- **完整訂單流程**  
  從「接收訂單 → 等待付款 → 製作中 → 完成」全流程管理。

- **訂單 Excel 匯出（支援月份篩選）**  
  商店主後台可直接匯出當月訂單報表，利於營運統計。

- **購物車支援宅配 / 面交，領取時間動態控制**  
  - **宅配**：自動填入「宅配流程」  
  - **面交**：15:00～24:00 整點選擇

- **前後端完全分離部署（Docker 容器化）**  
  - `backend`：Gin + GraphQL  
  - `frontend`：Nginx 提供靜態資源  
  - `db`：PostgreSQL

- **佈署至 AWS EC2，並支援 HTTPS + 自有網域**  
  - **使用 AWS Route 53 申請網域名稱**  
  - **透過 Nginx 配置 SSL（Let's Encrypt 或 ACM 憑證）實現 HTTPS**  
  - **完整部署流程：Docker Compose + Nginx + EC2 + Route53**
