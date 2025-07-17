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
  if (status === "completed") return "訂單已完成";
  return status;
}

function formatDate(raw) {
  return new Date(raw).toLocaleString("zh-TW", { hour12: false });
}

// 初始化會員資訊
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
    }

    fetchOrders();
  });

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

  const monthSelect = document.getElementById("month-select");
  if (monthSelect) {
    monthSelect.addEventListener("change", () => {
      fetchOrders();
    });
  }

  const exportBtn = document.getElementById("export-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const month = document.getElementById("month-select").value;
      if (!month) {
        alert("請先選擇月份");
        return;
      }
      window.open(`/admin/exportOrders?month=${month}`, "_blank");
    });
  }
});


function fetchOrders() {
  const queryName = currentUserRole === "admin" ? "allOrders" : "myOrders";

  let monthArg = "";
  if (currentUserRole === "admin") {
    const monthInput = document.getElementById("month-select");
    const month = monthInput?.value;

    if (month && month.length === 7) {  // 例如 "2025-07"
        monthArg = `(month: "${month}")`;
    }
  }

  fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      query: `
        query {
          ${queryName}${monthArg} {
            id
            createdAt
            status
            pickupDate
            totalAmount
            orderNumber
            pickupMethod
            address
            pickupTime
            name
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
        renderOrdersAdmin(ordersData);
      } else {
        renderOrdersUser(ordersData);
      }
    });
}


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

function renderOrdersAdmin(data) {
  const pendingContainer = document.getElementById("order-list-pending");
  const receivedContainer = document.getElementById("order-list-received");
  const paidContainer = document.getElementById("order-list-paid");
  const completedContainer = document.getElementById("order-list-completed");

  pendingContainer.innerHTML = "";
  receivedContainer.innerHTML = "";
  paidContainer.innerHTML = "";
  completedContainer.innerHTML = "";

  if (!data || data.length === 0) {
    pendingContainer.innerHTML = "<p>尚無訂單紀錄</p>";
    return;
  }

  data.forEach(order => {
    const div = createOrderCard(order);
    if (order.status === "pending") pendingContainer.appendChild(div);
    else if (order.status === "received") receivedContainer.appendChild(div);
    else if (order.status === "paid") paidContainer.appendChild(div);
    else if (order.status === "completed") completedContainer.appendChild(div);
  });
}

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
          <option value="completed" ${order.status === "completed" ? "selected" : ""}>已完成</option>
        </select>
      </div>
    `;
  }

  div.innerHTML = `
    <div class="order-item">
      <p><strong>訂單編號：</strong>${order.orderNumber}</p>
      ${order.name ? `<p><strong>訂貨人：</strong>${order.name}</p>` : ""}
      <p><strong>訂單狀態：</strong>${translateStatus(order.status)}</p>
      <p><strong>建立時間：</strong>${formatDate(order.createdAt)}</p>
      <p><strong>領取日期：</strong>${order.pickupDate ? new Date(order.pickupDate).toLocaleDateString("zh-TW") : "未指定"}</p>
      <p><strong>取貨方式：</strong>${order.pickupMethod}</p>
      <p><strong>取貨地址：</strong>${order.address}</p>
      <p><strong>取貨時間：</strong>${order.pickupTime}</p>
      <p><strong>總金額：</strong>$${order.totalAmount.toFixed(0)}</p>
      <ul>
        ${order.items.map(i => `<li>${i.productName} x ${i.quantity}（$${i.price}）</li>`).join("")}
      </ul>
      ${statusControls}
    </div>
  `;

  if (order.status === "received" && currentUserRole === "user") {
    div.innerHTML += `
      <button class="payment-info-btn" onclick="alert('匯款資訊\\n\\n戶名：羅伊伶\\n銀行：中國信託\\n代號：822\\n帳號：90156446241')">查看匯款資訊</button>
    `;
  }

  return div;
}

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


function updateProfile() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();

  if (!name || !email || !phone) {
    alert("請填寫完整資料");
    return;
  }

  fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      query: `
        mutation {
          updateMe(name: "${name}", email: "${email}", phone: "${phone}")
        }
      `
    })
  })
    .then(res => res.json())
    .then(res => {
      if (res.data && res.data.updateMe) {
        alert("資料更新成功");
      } else {
        alert("更新失敗：" + (res.errors?.[0]?.message || "未知錯誤"));
      }
    });
}
