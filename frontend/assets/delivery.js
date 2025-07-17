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
            description
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

      // 檸檬幕斯巴斯克蛋糕
      const lemonCakes = products.filter(p => p.name.includes("檸檬幕斯巴斯克蛋糕"));
      if (lemonCakes.length > 0) {
        const lemonDiv = document.createElement("div");
        lemonDiv.className = "product-card";

        lemonDiv.innerHTML = `
          <img src="${lemonCakes[0].imageUrl}" alt="檸檬幕斯巴斯克蛋糕" />
          <h3>檸檬幕斯巴斯克蛋糕</h3>
          <div id="lemon-options"></div>
        `;

        // 按照尺寸排序 4、6、8吋
        const lemonSorted = lemonCakes.sort((a, b) => parseInt(a.description) - parseInt(b.description));

        lemonSorted.forEach(c => {
          const btn = document.createElement("button");
          btn.textContent = `${c.description} - $${c.price}`;
          btn.onclick = () => addToCart(c.id, `${c.name} ${c.description}`, c.price);
          lemonDiv.querySelector("#lemon-options").appendChild(btn);
        });

        container.appendChild(lemonDiv);
      }

      // 玫瑰荔枝慕斯蛋糕
      const roseCakes = products.filter(p => p.name.includes("玫瑰荔枝慕斯蛋糕"));
      if (roseCakes.length > 0) {
        const roseDiv = document.createElement("div");
        roseDiv.className = "product-card";

        roseDiv.innerHTML = `
          <img src="${roseCakes[0].imageUrl}" alt="玫瑰荔枝慕斯蛋糕" />
          <h3>玫瑰荔枝慕斯蛋糕</h3>
          <div id="rose-options"></div>
        `;

        const roseSorted = roseCakes.sort((a, b) => parseInt(a.description) - parseInt(b.description));

        roseSorted.forEach(c => {
          const btn = document.createElement("button");
          btn.textContent = `${c.description} - $${c.price}`;
          btn.onclick = () => addToCart(c.id, `${c.name} ${c.description}`, c.price);
          roseDiv.querySelector("#rose-options").appendChild(btn);
        });

        container.appendChild(roseDiv);
      }

      // 其他商品照原本邏輯
      const otherCakes = products.filter(p => 
        !p.name.includes("檸檬幕斯巴斯克蛋糕") && !p.name.includes("玫瑰荔枝慕斯蛋糕")
      );

      otherCakes.forEach(p => {
        const div = document.createElement("div");
        div.className = "product-card";
        div.innerHTML = `
          <img src="${p.imageUrl}" alt="${p.name}" />
          <h3>${p.name}</h3>
          <p>$${p.price}</p>
          <input type="number" id="qty-${p.id}" min="1" value="1" style="width: 60px; margin-top: 5px;" />
          <br/>
          <button onclick="addToCart(${p.id}, '${p.name}', ${p.price})">加入購物車</button>
        `;
        container.appendChild(div);
      });
    });
}


// ✅ 加入購物車功能
function addToCart(id, name, price) {
  let quantity = 1;  // 預設數量是1

  const qtyInput = document.getElementById(`qty-${id}`);
  if (qtyInput) {
    quantity = parseInt(qtyInput.value) || 1;  // 如果有輸入框就取數量
  }

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const existing = cart.find(i => i.productID === id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productID: id, name, price, quantity });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  alert(`${name} 已加入購物車（數量：${quantity}）！`);
}

// ✅ 權限檢查：非 admin 隱藏新增按鈕
function checkAdmin() {
  const token = localStorage.getItem("token");
  if (!token) {
    document.querySelector("button[onclick='addProduct()']").style.display = "none";
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
        {
          meInfo {
            role
          }
        }
      `
    })
  })
    .then(res => res.json())
    .then(res => {
      const role = res.data?.meInfo?.role;
      if (!role || role !== "admin") {
        document.querySelector("button[onclick='addProduct()']").style.display = "none";
      }
    })
    .catch(() => {
      document.querySelector("button[onclick='addProduct()']").style.display = "none";
    });
}

// ✅ 頁面載入時執行
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  checkAdmin();
});
