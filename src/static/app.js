const activitiesList = document.getElementById("activities-list");
const activitySelect = document.getElementById("activity");
const signupForm = document.getElementById("signup-form");
const messageDiv = document.getElementById("message");
const userStatusDiv = document.getElementById("user-status");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const logoutButton = document.getElementById("logout-button");

let currentUser = null;

function showMessage(element, text, type = "success") {
  element.textContent = text;
  element.className = `message ${type}`;
  element.classList.remove("hidden");
  setTimeout(() => element.classList.add("hidden"), 5000);
}

async function fetchCurrentUser() {
  try {
    const response = await fetch("/me");
    if (!response.ok) {
      currentUser = null;
      updateAuthState();
      return;
    }
    const data = await response.json();
    currentUser = data.email;
  } catch (error) {
    currentUser = null;
  }
  updateAuthState();
}

function updateAuthState() {
  if (currentUser) {
    userStatusDiv.textContent = `Signed in as ${currentUser}`;
    userStatusDiv.className = "message info";
    userStatusDiv.classList.remove("hidden");
    loginForm.classList.add("hidden");
    registerForm.classList.add("hidden");
    logoutButton.classList.remove("hidden");
    signupForm.classList.remove("hidden");
  } else {
    userStatusDiv.textContent = "Not signed in";
    userStatusDiv.className = "message info";
    userStatusDiv.classList.remove("hidden");
    loginForm.classList.remove("hidden");
    registerForm.classList.remove("hidden");
    logoutButton.classList.add("hidden");
    signupForm.classList.add("hidden");
  }
}

async function fetchActivities() {
  try {
    const response = await fetch("/activities");
    const activities = await response.json();

    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;

      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;

      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });

    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  } catch (error) {
    activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
    console.error("Error fetching activities:", error);
  }
}

async function handleUnregister(event) {
  const button = event.target;
  const activity = button.getAttribute("data-activity");

  try {
    const response = await fetch(
      `/activities/${encodeURIComponent(activity)}/unregister`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    if (response.ok) {
      showMessage(messageDiv, result.message, "success");
      await fetchActivities();
    } else {
      showMessage(messageDiv, result.detail || "An error occurred", "error");
    }
  } catch (error) {
    showMessage(messageDiv, "Failed to unregister. Please try again.", "error");
    console.error("Error unregistering:", error);
  }
}

async function handleSignup(event) {
  event.preventDefault();
  const activity = activitySelect.value;

  try {
    const response = await fetch(
      `/activities/${encodeURIComponent(activity)}/signup`,
      {
        method: "POST",
      }
    );

    const result = await response.json();

    if (response.ok) {
      showMessage(messageDiv, result.message, "success");
      signupForm.reset();
      await fetchActivities();
    } else {
      showMessage(messageDiv, result.detail || "An error occurred", "error");
    }
  } catch (error) {
    showMessage(messageDiv, "Failed to sign up. Please try again.", "error");
    console.error("Error signing up:", error);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_email: email, password }),
    });

    const result = await response.json();
    if (response.ok) {
      currentUser = result.email;
      updateAuthState();
      showMessage(messageDiv, result.message, "success");
      await fetchActivities();
    } else {
      showMessage(messageDiv, result.detail || "Login failed", "error");
    }
  } catch (error) {
    showMessage(messageDiv, "Login failed. Please try again.", "error");
    console.error("Error logging in:", error);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value.trim();

  try {
    const response = await fetch("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_email: email, password }),
    });

    const result = await response.json();
    if (response.ok) {
      showMessage(messageDiv, result.message, "success");
      registerForm.reset();
    } else {
      showMessage(messageDiv, result.detail || "Registration failed", "error");
    }
  } catch (error) {
    showMessage(messageDiv, "Registration failed. Please try again.", "error");
    console.error("Error registering:", error);
  }
}

async function handleLogout() {
  try {
    const response = await fetch("/logout", {
      method: "POST",
    });
    if (response.ok) {
      currentUser = null;
      updateAuthState();
      showMessage(messageDiv, "Logged out successfully", "success");
      await fetchActivities();
    }
  } catch (error) {
    showMessage(messageDiv, "Logout failed. Please try again.", "error");
    console.error("Error logging out:", error);
  }
}

signupForm.addEventListener("submit", handleSignup);
loginForm.addEventListener("submit", handleLogin);
registerForm.addEventListener("submit", handleRegister);
logoutButton.addEventListener("click", handleLogout);

fetchCurrentUser().then(fetchActivities);
