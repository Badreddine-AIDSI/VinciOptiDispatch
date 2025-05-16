document.getElementById('searchForm').addEventListener('submit', function(event) {
    event.preventDefault();
});

document.getElementById('searchField').addEventListener('input', function() {
    let searchText = this.value;

    fetch('/search-expenses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ searchText: searchText })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        let tableBody = document.getElementById('expensesTable');
        tableBody.innerHTML = '';

        data.forEach(expense => {
            let row = `<tr>
                <td>${expense.amount}</td>
                <td>${expense.description}</td>
                <td>${expense.category}</td>
                <td>${new Date(expense.date).toLocaleDateString()}</td>
                <td>
                    <a href="/edit-expense/${expense.id}" class="btn btn-sm btn-warning">Edit</a>
                    <a href="/delete-expense/${expense.id}" class="btn btn-sm btn-danger">Delete</a>
                </td>
            </tr>`;
            tableBody.innerHTML += row;
        });
    })
    .catch(error => {
        console.error('Error during fetch:', error);
    });
});

// Function to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
