# 🍰 多巴胺甜點工作室 - Cake Store Platform

本專案是一個線上蛋糕訂購平台，提供會員註冊、商品瀏覽、購物車下單、商店後台管理與訂單匯出功能。  
完整支援前後端分離開發，使用 **GraphQL API** 串接，並以 **Docker 容器化部署**。

---

## 🔧 使用技術

| 技術 | 說明 |
|--------|---------|
| **後端 Golang + Gin** | REST 路由 + GraphQL API |
| **GraphQL** | 全站 API（**手寫 Schema，無自動生成**） |
| **PostgreSQL** | 資料儲存（會員 / 商品 / 訂單） |
| **JWT** | 會員登入驗證 |
| **Excelize** | 訂單 Excel 匯出 |
| **前端 HTML/CSS/JavaScript** | 原生語法，無框架 |
| **Docker / Docker Compose** | 前後端 + DB 容器化部署 |

---

## 🗂 專案結構

### 後端

backend/
├── main.go // 程式進入點
├── database/ // DB 初始化
├── graph/ // GraphQL Schema / Resolver
├── models/ // 資料結構
├── middlewares/ // JWT 驗證
├── handlers/ // 訂單匯出 Excel
├── routes/ // 路由管理


### 前端

frontend/
├── index.html // 首頁（商品 + 品牌介紹）
├── delivery.html // 商品專區（支援新增商品功能）
├── cart.html // 購物車（宅配 / 面交）
├── register.html // 註冊
├── login.html // 登入（JWT 儲存）
├── member.html // 會員平台（商店主與顧客共用）
├── notice.html / flow.html / policy.html // 訂購須知 / 流程 / 退換貨
├── instagram.html / line.html // 社群頁面
├── assets/ // CSS / JS / 圖片


---

## 🚀 Docker 快速啟動

```bash
docker-compose up --build
| 服務              | 說明                   |
| --------------- | -------------------- |
| `cake_backend`  | Golang Gin + GraphQL |
| `cake_frontend` | Nginx + 靜態頁面         |
| `db`            | PostgreSQL           |

📦 功能總覽
前端功能
商品瀏覽與購物車

訂單提交（宅配 / 面交）

會員註冊登入（JWT）

會員專區（顧客訂單查詢）

商店後台（訂單管理 + 訂單匯出 Excel）

後端功能（GraphQL）
功能	說明
register	註冊會員
login	登入，回傳 JWT
meInfo	查詢會員資訊
products	查詢商品
createProduct	新增商品（Admin）
createOrder	下單
myOrders	查詢個人訂單
allOrders	管理員查詢所有訂單（可篩選月份）
updateOrderStatus	更新訂單狀態
/admin/exportOrders	匯出訂單 Excel

🗄️ 資料表（PostgreSQL）
users：會員（含一般與 admin）

products：蛋糕商品

orders：訂單主表

order_items：訂單明細

💡 系統亮點（面試可說明）
全站 GraphQL 串接，無 Codegen，自行設計 Schema 與 Resolver

JWT 全站認證，支援多角色（Admin / User）

商店後台與顧客平台 雙向同步

訂單狀態流程完整：接收 / 付款 / 進行中 / 完成

支援 Excel 匯出（月份篩選）

前後端完全分離部署，Docker 管理完整環境

🔗 預覽頁面（可選擇自行補充圖片）
商品列表 / 加入購物車

會員平台（訂單查詢 / 訂單管理）

訂單匯出 Excel 示意

商店主與一般會員畫面切換

📌 未來擴充方向
金流串接（如 TapPay / 綠界）

React / Vue 重構前端後台

佈署至 EC2 並開啟 HTTPS

```