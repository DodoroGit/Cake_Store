const token = localStorage.getItem("token");
const cart = JSON.parse(localStorage.getItem("cart") || "[]");
const container = document.getElementById("cart-items");

function renderCart() {
    container.innerHTML = "";
    let total = 0;

    cart.forEach((item, index) => {
    const subtotal = item.price * item.quantity;
    total += subtotal;

    const div = document.createElement("div");
    div.innerHTML = `
        <h3>${item.name} - $${item.price} x ${item.quantity} = $${subtotal}</h3>
        <button onclick="removeItem(${index})">移除</button>
        <hr/>
    `;
    container.appendChild(div);
    });

    document.getElementById("total").textContent = "總金額：$" + total;
}

function removeItem(index) {
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
}

function clearCart() {
    localStorage.removeItem("cart");
    location.reload();
}

function submitOrder() {
    if (cart.length === 0) {
    alert("購物車是空的！");
    return;
    }

    const orderItems = cart.map(item => ({
    productID: item.productID,
    quantity: item.quantity
    }));

    fetch("/graphql", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
        query: `
        mutation($items: [OrderItemInput!]!) {
            createOrder(items: $items)
        }
        `,
        variables: { items: orderItems }
    })
    })
    .then(res => res.json())
    .then(res => {
    if (res.data?.createOrder) {
        alert("✅ 訂單送出成功！");
        localStorage.removeItem("cart");
        window.location.href = "member.html";
    } else {
        alert("❌ 訂單失敗：" + (res.errors?.[0]?.message || "未知錯誤"));
    }
    });
}

renderCart();