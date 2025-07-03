// ✅ 新增商品功能
function addProduct() {
  const name = prompt("請輸入商品名稱");
  if (!name) return;

  const price = parseFloat(prompt("請輸入價格"));
  if (isNaN(price)) return alert("價格無效");

  const imageUrl = prompt("請輸入圖片網址");
  const description = prompt("請輸入商品描述（可留空）");

  const token = localStorage.getItem("token");

  fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      query: `
        mutation CreateProduct($name: String!, $description: String, $price: Float!, $imageUrl: String) {
          createProduct(name: $name, description: $description, price: $price, imageUrl: $imageUrl)
        }
      `,
      variables: {
        name,
        description: description || "",
        price,
        imageUrl: imageUrl || ""
      }
    })
  })
    .then(res => res.json())
    .then(res => {
      if (res.errors) {
        alert("新增失敗：" + res.errors[0].message);
      } else {
        alert("✅ 新增成功！");
        location.reload();
      }
    });
}

// ✅ 載入商品列表
function loadProducts() {
  const token = localStorage.getItem("token");

  fetch("/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      query: `
        {
          products {
            id
            name
            price
            imageUrl
          }
        }
      `
    })
  })
    .then(res => res.json())
    .then(res => {
      const products = res.data.products;
      const container = document.getElementById("product-list");
      if (!container) return;

      products.forEach(p => {
        const div = document.createElement("div");
        div.className = "product-card";
        div.innerHTML = `
          <img src="${p.imageUrl}" alt="${p.name}" />
          <h3>${p.name}</h3>
          <p>$${p.price}</p>
          <button onclick="addToCart(${p.id}, '${p.name}', ${p.price})">加入購物車</button>
        `;
        container.appendChild(div);
      });
    });
}

// ✅ 加入購物車功能
function addToCart(id, name, price) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const existing = cart.find(i => i.productID === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ productID: id, name, price, quantity: 1 });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  alert(`${name} 已加入購物車！`);
}

// ✅ 頁面載入時載入商品
document.addEventListener("DOMContentLoaded", loadProducts);
