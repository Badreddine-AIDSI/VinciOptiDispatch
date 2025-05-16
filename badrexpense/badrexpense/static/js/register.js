const usernameField = document.querySelector('#usernameField');
const feedbackArea = document.querySelector('.invalid_feedback');
const emailField = document.querySelector('#emailField');
const emailFeedbackArea = document.querySelector('.email_feedback_area');
const usernameSuccessOutput = document.querySelector('.usernameSuccessOutput');
const emailSuccessOutput = document.querySelector('.emailSuccessOutput');
const showPasswordToggle = document.querySelector('.showPasswordToggle');
const passwordField = document.querySelector('#passwordField');
const passwordfeedbackArea = document.querySelector('.password_feedback_area');

let debounceTimer;

const debounce = (callback, delay) => {
    return (...args) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            callback(...args);
        }, delay);
    };
};

const validateUsername = (usernameVal) => {
    fetch('/auth/validate-username', {
        body: JSON.stringify({ username: usernameVal }),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log('data:', data);
        if (data.username_error) {
            usernameField.classList.add('is-invalid');
            feedbackArea.style.display = 'block';
            feedbackArea.innerHTML = `<p>${data.username_error}</p>`;
        } else {
            usernameField.classList.remove('is-invalid');
            feedbackArea.style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
};

const validateEmail = (emailVal) => {
    fetch('/auth/validate-email', {
        body: JSON.stringify({ email: emailVal }),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log('data:', data);
        if (data.email_error) {
            emailFeedbackArea.style.display = 'block';
            emailFeedbackArea.innerHTML = `<p>${data.email_error}</p>`;
        } else {
            emailField.classList.remove('is-invalid');
            emailFeedbackArea.style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
};
const validatePassword = (passwordVal) => {
    fetch('/auth/validate-password', {
        body: JSON.stringify({ password: passwordVal }),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log('data:', data);
        if (data.password_error) {
            passwordField.classList.add('is-invalid');
            passwordfeedbackArea.style.display = 'block';
            feedbackArea.innerHTML = `<p>${data.password_error}</p>`;
        } else {
            passwordField.classList.remove('is-invalid');
            passwordfeedbackArea.style.display = 'none';
        }
    })
}

usernameField.addEventListener('keyup', (e) => {
    const usernameVal = e.target.value;
    usernameSuccessOutput.textContent = `Checking ${usernameVal}`;
    if (usernameVal.length > 0) {
        debounce(() => validateUsername(usernameVal), 500)();
    } else {
        usernameSuccessOutput.style.display = 'none';
        usernameField.classList.remove('is-invalid');
        feedbackArea.style.display = 'none';
    }
});

emailField.addEventListener('keyup', (e) => {
    const emailVal = e.target.value;
    emailSuccessOutput.textContent = `Checking ${emailVal}`;
    if (emailVal.length > 0) {
        debounce(() => validateEmail(emailVal), 500)();
    } else {
        emailSuccessOutput.style.display = 'none';
        emailFeedbackArea.style.display = 'none';
        emailField.classList.remove('is-invalid');

    }
});
passwordField.addEventListener('keyup', (e) => {
    const passwordVal = e.target.value;
    if (passwordVal.length > 0) {
        debounce(() => validatePassword(passwordVal), 500)();
    } else {
        passwordField.classList.remove('is-invalid');
        passwordfeedbackArea.style.display = 'none';
    }
});
showPasswordToggle.addEventListener('click', () => {
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
    showPasswordToggle.textContent = type === 'password' ? 'SHOW' : 'HIDE';
});