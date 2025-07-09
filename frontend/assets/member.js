const token = localStorage.getItem("token");
if (!token) {
  alert("請先登入");
  window.location.href = "login.html";
}

function translateStatus(status) {
  if (status === "pending") return "訂單等待接收中";
  if (status === "received") return "訂單已接收";
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
  document.getElementById("name").value = info.name || "";
  document.getElementById("email").value = info.email;
  document.getElementById("phone").value = info.phone;
  document.getElementById("role").textContent = info.role;
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

// ✅ 查詢訂單資訊
fetch("/graphql", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({
    query: `
      query {
        myOrders {
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
  const orders = res.data.myOrders;
  const container = document.getElementById("order-list");

  if (!orders || orders.length === 0) {
    container.innerHTML = "<p>尚無訂單紀錄</p>";
    return;
  }

  orders.forEach(order => {
    const div = document.createElement("div");
    div.innerHTML = `
      <div class="order-item">
        <p><strong>訂單狀態：</strong>${translateStatus(order.status)}</p>
        <p><strong>建立時間：</strong>${formatDate(order.createdAt)}</p>
        <p><strong>領取日期：</strong>${order.pickupDate ? new Date(order.pickupDate).toLocaleDateString("zh-TW") : "未指定"}</p>
        <p><strong>總金額：</strong>$${order.totalAmount.toFixed(0)}</p>
        <ul>
          ${order.items.map(i => `<li>${i.productName} x ${i.quantity}（$${i.price}）</li>`).join("")}
        </ul>
      </div>
    `;
    container.appendChild(div);
  });
});
