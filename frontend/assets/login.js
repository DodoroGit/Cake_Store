document.getElementById("login-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password)
        }
      `,
      variables: { email, password }
    })
  });

  const result = await res.json();
  if (result.data && result.data.login) {
    const token = result.data.login;
    localStorage.setItem("token", token); // ✅ 存入本地 JWT
    window.location.href = "member.html"; // ✅ 跳轉會員頁
  } else {
    document.getElementById("message").textContent =
      result.errors?.[0]?.message || "登入失敗";
  }
});
