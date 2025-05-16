document.getElementById('searchForm').addEventListener('submit', function(event) {
    event.preventDefault();
});

document.getElementById('searchField').addEventListener('input', function() {
    let searchText = this.value;

    fetch('/search-forum-tasks', {
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
        let tableBody = document.getElementById('tasksTable');
        tableBody.innerHTML = '';

        data.forEach(task => {
            let row = `<tr>
                <td>${task.machine__name}</td>
                <td>${task.description}</td>
                <td>${task.category__name}</td>
                <td class="text-capitalize">${task.status}</td>
                <td>${new Date(task.date_reported).toLocaleDateString()}</td>
                <td>${task.reported_by__username}</td>
                <td>${task.assigned_to__username || 'Unassigned'}</td>
                <td>
                    <a href="/edit-forum-task/${task.id}" class="btn btn-sm btn-warning">Edit</a>
                    <a href="/delete-forum-task/${task.id}" class="btn btn-sm btn-danger">Delete</a>
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
