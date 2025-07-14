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
                <p>$${item.price} x 
                    <button onclick="changeQuantity(${index}, -1)">➖</button>
                    <span class="quantity">${item.quantity}</span>
                    <button onclick="changeQuantity(${index}, 1)">➕</button>
                    = <strong>$${subtotal}</strong>
                </p>
                <button onclick="removeItem(${index})">移除</button>
            </div>
        `;
        container.appendChild(div);
    });

    document.getElementById("total").textContent = "總金額：$" + total;
}

function changeQuantity(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
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
    const pickupDate = document.getElementById("pickup-date").value;
    const pickupMethod = document.getElementById("pickup-method").value;
    const pickupTime = document.getElementById("pickup-time").value;
    const address = document.getElementById("address").value;

    if (!pickupDate || !pickupTime) {
        alert("請填寫取貨日期與時間！");
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
                mutation($items: [OrderItemInput!]!, $pickupDate: String!, $pickupMethod: String!, $pickupTime: String!, $address: String!) {
                    createOrder(items: $items, pickupDate: $pickupDate, pickupMethod: $pickupMethod, pickupTime: $pickupTime, address: $address)
                }
            `,
            variables: {
                items: orderItems,
                pickupDate: pickupDate,
                pickupMethod: pickupMethod,
                pickupTime: pickupTime,
                address: address
            }
        })
    })
    .then(res => res.json())
    .then(res => {
        if (res.data?.createOrder) {
            alert(res.data.createOrder); // 顯示後端傳來的訂單編號
            localStorage.removeItem("cart");
            window.location.href = "member.html";
        } else {
            alert("❌ 訂單失敗：" + (res.errors?.[0]?.message || "未知錯誤"));
        }
    });
}

function toggleAddress() {
    const method = document.getElementById("pickup-method").value;
    const addressInput = document.getElementById("address");
    if (method === "現場取貨") {
        addressInput.value = "新竹市東區明湖路233號";
        addressInput.disabled = true;
    } else {
        addressInput.value = "";
        addressInput.disabled = false;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    toggleAddress();  // 預設選擇「現場取貨」時，自動帶入地址
    renderCart();
});
