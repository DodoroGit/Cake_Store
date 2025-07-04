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
        div.className = "cart-item";
        div.innerHTML = `
            <h3>${item.name}</h3>
            <div>
                <p>$${item.price} x ${item.quantity} = <strong>$${subtotal}</strong></p>
                <button onclick="removeItem(${index})">移除</button>
            </div>
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
    const pickupDate = document.getElementById("pickup-date")?.value;
    if (!pickupDate) {
        alert("請選擇取貨日期！");
        return;
    }

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
                mutation($items: [OrderItemInput!]!, $pickupDate: String!) {
                    createOrder(items: $items, pickupDate: $pickupDate)
                }
            `,
            variables: {
                items: orderItems,
                pickupDate: pickupDate
            }
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