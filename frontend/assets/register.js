document.getElementById("register-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const phone = document.getElementById("phone").value;

  const res = await fetch("/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        mutation Register($email: String!, $password: String!, $phone: String!) {
          register(email: $email, password: $password, phone: $phone)
        }
      `,
      variables: { email, password, phone }
    })
  });

  const result = await res.json();
  const msg = result.data?.register || result.errors?.[0]?.message || "註冊失敗";
  const messageBox = document.getElementById("message");

  messageBox.textContent = msg;

  if (msg === "註冊成功") {
    messageBox.style.color = "green";
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  } else {
    messageBox.style.color = "red";
  }
});
