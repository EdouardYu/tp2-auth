window.validateForm = async function (e) {
  e.preventDefault();

  const username = document.forms["registerForm"]["username"].value;
  const email = document.forms["registerForm"]["email"].value;
  const password = document.forms["registerForm"]["password"].value;
  const passwordConfirm =
    document.forms["registerForm"]["passwordConfirm"].value;

  let errorMessages = [];

  const usernamePattern = /^[a-zA-Z0-9]+$/;
  if (!usernamePattern.test(username)) {
    errorMessages.push("Username must contain only letters and numbers");
  }

  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/;
  if (!strongPasswordRegex.test(password)) {
    errorMessages.push(
      "Password must be at least 12 characters long, contain uppercase, lowercase, numbers, and special characters"
    );
  }

  if (password !== passwordConfirm) {
    errorMessages.push("Passwords do not match");
  }

  const errorPopup = document.getElementById("errorPopup");
  if (errorMessages.length > 0) {
    errorPopup.innerHTML = errorMessages.join("<br>");
    errorPopup.style.display = "block";
    return false;
  } else {
    errorPopup.style.display = "none";

    const formData = {
      username: username,
      email: email,
      password: password,
      passwordConfirm: passwordConfirm,
    };

    try {
      const response = await fetch("/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.status === 400 && data.errors) {
        errorPopup.innerHTML = data.errors;
        errorPopup.style.display = "block";
      } else if (response.status === 200) {
        window.location.href = "/login";
      } else {
        throw new Error();
      }
    } catch (error) {
      console.error("Error:", error);
      errorPopup.innerHTML =
        "An unexpected error occurred. Please try again later";
      errorPopup.style.display = "block";
    }

    return false;
  }
};
