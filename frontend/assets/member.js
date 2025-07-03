const token = localStorage.getItem("token");

if (!token) {
  alert("請先登入");
  window.location.href = "login.html";
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
        <h3>訂單 #${order.id} - ${order.status}</h3>
        <p><strong>時間：</strong>${order.createdAt}</p>
        <ul>
          ${order.items.map(i => `<li>${i.productName} x ${i.quantity}（$${i.price}）</li>`).join("")}
        </ul>
        <hr/>
      `;
      container.appendChild(div);
    });
  });
