# 🍰 多巴胺甜點工作室 - Dopamine Cake Store

一個支援**前後端分離、GraphQL 全站 API、Docker 容器化部署**的線上蛋糕訂購平台。  
提供 **商品瀏覽、購物車下單、會員管理、後台訂單管理、訂單匯出 Excel** 等功能。  

適合作為全端實戰作品，並可於面試展示。

---

## 🔧 使用技術與架構

| 技術 / 工具               | 說明                               |
| ------------------------ | ---------------------------------- |
| **後端 Golang + Gin**     | REST 路由 + GraphQL API            |
| **GraphQL（手寫 Schema）** | 全站資料操作，**無 Codegen，自行撰寫 Resolver** |
| **PostgreSQL**            | 資料儲存（會員 / 商品 / 訂單）    |
| **JWT**                   | 會員登入驗證，支援多角色 (Admin / User) |
| **Excelize**              | 訂單匯出 Excel（支援月份篩選）    |
| **前端 HTML/CSS/JS**      | 原生語法撰寫，無框架                |
| **Nginx**                 | 前端靜態檔案服務                   |
| **Docker / Docker Compose** | 完整容器化，快速部署               |
| **AWS EC2 + Route 53**    | 雲端主機部署，支援自有網域與 HTTPS |

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
├── main.go // 入口主程式
├── database/ // DB 初始化
├── graph/ // GraphQL Schema / Resolver
├── models/ // 資料結構（User/Product/Order）
├── middlewares/ // JWT 驗證
├── handlers/ // 訂單匯出 Excel
├── routes/ // 路由註冊
```

### 前端（frontend/）

```
frontend/
├── index.html // 首頁（商品瀏覽）
├── delivery.html // 商品專區（支援新增商品功能）
├── cart.html // 購物車（宅配 / 面交選擇）
├── register.html // 會員註冊
├── login.html // 會員登入（JWT 儲存於 localStorage）
├── member.html // 會員專區（顧客 / 商店主雙畫面）
├── notice.html // 訂購須知
├── flow.html // 購物流程
├── policy.html // 退換貨政策
├── instagram.html // Instagram 社群頁
├── line.html // Line 聯絡頁
├── assets/ // CSS / JS / 圖片資源
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
docker-compose up --build
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
