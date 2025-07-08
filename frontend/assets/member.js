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
    const info = res.data.meInfo;
    document.getElementById("name").value = info.name || "";
    document.getElementById("email").textContent = info.email;
    document.getElementById("phone").textContent = info.phone;
    document.getElementById("role").textContent = info.role;
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
        <ul>
          ${order.items.map(i => `<li>${i.productName} x ${i.quantity}（$${i.price}）</li>`).join("")}
        </ul>
      </div>
    `;
      container.appendChild(div);
    });
  });

function updateProfile() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;

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
    alert(res.data.updateMe || "更新成功");
    location.reload();
  });
}