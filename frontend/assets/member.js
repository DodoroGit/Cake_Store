const token = localStorage.getItem("token");
if (!token) {
  alert("請先登入");
  window.location.href = "login.html";
}

let currentUserRole = "user"; // 預設

function translateStatus(status) {
  if (status === "pending") return "訂單等待接收中";
  if (status === "received") return "已接收訂單等待付款";
  if (status === "paid") return "已付款訂單進行中";
  return status;
}

function formatDate(raw) {
  return new Date(raw).toLocaleString("zh-TW", { hour12: false });
}

// ✅ 查詢會員資訊
fetch("/graphql", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({
    query: `
      query {
        meInfo {
          name
          email
          phone
          role
        }
      }
    `
  })
})
.then(res => res.json())
.then(res => {
  if (!res.data || !res.data.meInfo) {
    alert("登入已過期，請重新登入");
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return;
  }

  const info = res.data.meInfo;
  currentUserRole = info.role === "admin" ? "admin" : "user";
  document.getElementById("name").value = info.name || "";
  document.getElementById("email").value = info.email;
  document.getElementById("phone").value = info.phone;
  document.getElementById("role").textContent = currentUserRole === "admin" ? "商店主" : "一般會員";

  if (currentUserRole === "admin") {
    document.getElementById("order-title").textContent = "📋 訂單管理系統";
  }

  fetchOrders(); // ✅ 查詢訂單資料（根據身份）
});

// ✅ 登出按鈕
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      alert("已登出");
      window.location.href = "login.html";
    });
  }
});

// ✅ 根據身分查詢 myOrders（一般會員）或 allOrders（商店主）
function fetchOrders() {
  const queryName = currentUserRole === "admin" ? "allOrders" : "myOrders";

  fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      query: `
        query {
          ${queryName} {
            id
            createdAt
            status
            pickupDate
            totalAmount
            items {
              productName
              quantity
              price
            }
          }
        }
      `
    })
  })
  .then(res => res.json())
  .then(res => {
    const orders = res.data[queryName];
    const container = document.getElementById("order-list");

    if (!orders || orders.length === 0) {
      container.innerHTML = "<p>尚無訂單紀錄</p>";
      return;
    }

    container.innerHTML = ""; // 清空舊資料

    orders.forEach(order => {
      const div = document.createElement("div");

      let statusControls = "";
      if (currentUserRole === "admin") {
        statusControls = `
          <div style="margin-top: 0.5rem;">
            <label><strong>更改狀態：</strong></label>
            <select onchange="updateOrderStatus(${order.id}, this.value)">
              <option value="pending" ${order.status === "pending" ? "selected" : ""}>等待接收</option>
              <option value="received" ${order.status === "received" ? "selected" : ""}>等待付款</option>
              <option value="paid" ${order.status === "paid" ? "selected" : ""}>進行中</option>
            </select>
          </div>
        `;
      }

      div.innerHTML = `
        <div class="order-item">
          <p><strong>訂單狀態：</strong>${translateStatus(order.status)}</p>
          <p><strong>建立時間：</strong>${formatDate(order.createdAt)}</p>
          <p><strong>領取日期：</strong>${order.pickupDate ? new Date(order.pickupDate).toLocaleDateString("zh-TW") : "未指定"}</p>
          <p><strong>總金額：</strong>$${order.totalAmount.toFixed(0)}</p>
          <ul>
            ${order.items.map(i => `<li>${i.productName} x ${i.quantity}（$${i.price}）</li>`).join("")}
          </ul>
          ${statusControls}
        </div>
      `;
      container.appendChild(div);
    });
  });
}

// ✅ 商店主更新訂單狀態（用 GraphQL mutation）
function updateOrderStatus(orderId, newStatus) {
  fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      query: `
        mutation {
          updateOrderStatus(orderId: ${orderId}, status: "${newStatus}")
        }
      `
    })
  })
  .then(res => res.json())
  .then(res => {
    if (res.data && res.data.updateOrderStatus === "OK") {
      alert("訂單狀態已更新");
      location.reload();
    } else {
      alert("更新失敗：" + (res.errors?.[0]?.message || "未知錯誤"));
    }
  });
}
