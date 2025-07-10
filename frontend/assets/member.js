const token = localStorage.getItem("token");
if (!token) {
  alert("請先登入");
  window.location.href = "login.html";
}

let currentUserRole = "user";
let ordersData = [];

function translateStatus(status) {
  if (status === "pending") return "訂單等待接收中";
  if (status === "received") return "已接收訂單等待付款";
  if (status === "paid") return "已付款訂單進行中";
  return status;
}

function formatDate(raw) {
  return new Date(raw).toLocaleString("zh-TW", { hour12: false });
}

// ✅ 初始化會員資訊
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
      document.getElementById("sort-controls").style.display = "block";

      document.getElementById("admin-order-section").style.display = "flex";
      // ✅ 新增這三行讓三區塊顯示出來
      document.getElementById("pending-orders").style.display = "block";
      document.getElementById("received-orders").style.display = "block";
      document.getElementById("paid-orders").style.display = "block";
    }

    fetchOrders();
  });

// ✅ 登出功能
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      alert("已登出");
      window.location.href = "login.html";
    });
  }

  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      const sorted = sortOrders([...ordersData], sortSelect.value);
      if (currentUserRole === "admin") {
        renderOrdersAdmin(sorted);
      }
    });
  }
});

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
      ordersData = res.data[queryName] || [];
      if (currentUserRole === "admin") {
        const sorted = sortOrders([...ordersData], document.getElementById("sort-select").value);
        renderOrdersAdmin(sorted);
      } else {
        renderOrdersUser(ordersData);
      }
    });
}

// ✅ 排序工具
function sortOrders(data, sortBy) {
  return data.sort((a, b) => {
    if (sortBy === "createdAt" || sortBy === "pickupDate") {
      return new Date(a[sortBy]) - new Date(b[sortBy]);
    }
    if (sortBy === "totalAmount") {
      return b.totalAmount - a.totalAmount;
    }
    if (sortBy === "status") {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });
}

// ✅ 一般會員：單一訂單區塊
function renderOrdersUser(data) {
  const container = document.getElementById("order-list");
  container.innerHTML = "";

  if (!data || data.length === 0) {
    container.innerHTML = "<p>尚無訂單紀錄</p>";
    return;
  }

  data.forEach(order => {
    const div = createOrderCard(order);
    container.appendChild(div);
  });
}

// ✅ 商店主：依狀態分類三區塊
function renderOrdersAdmin(data) {
  const pendingContainer = document.getElementById("order-list-pending");
  const receivedContainer = document.getElementById("order-list-received");
  const paidContainer = document.getElementById("order-list-paid");

  pendingContainer.innerHTML = "";
  receivedContainer.innerHTML = "";
  paidContainer.innerHTML = "";

  if (!data || data.length === 0) {
    pendingContainer.innerHTML = "<p>尚無訂單紀錄</p>";
    return;
  }

  data.forEach(order => {
    const div = createOrderCard(order);
    if (order.status === "pending") pendingContainer.appendChild(div);
    else if (order.status === "received") receivedContainer.appendChild(div);
    else if (order.status === "paid") paidContainer.appendChild(div);
  });
}

// ✅ 建立單筆訂單 DOM
function createOrderCard(order) {
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
  return div;
}

// ✅ 商店主更新訂單狀態
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
        fetchOrders();
      } else {
        alert("更新失敗：" + (res.errors?.[0]?.message || "未知錯誤"));
      }
    });
}
