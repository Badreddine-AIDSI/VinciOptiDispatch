document.getElementById('saveMachineBtn').addEventListener('click', function () {
    const machineName = document.getElementById('newMachineName').value;
    const machineDescription = document.getElementById('newMachineDescription').value;
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch(addMachineUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': csrfToken,
        },
        body: new URLSearchParams({
            newMachineName: machineName,
            newMachineDescription: machineDescription
        }),
    })
    .then(response => response.json())
    .then(data => {
        const machineSelect = document.getElementById('machine');
        const newOption = document.createElement('option');
        newOption.value = data.id;
        newOption.textContent = data.name;
        machineSelect.appendChild(newOption);

        // Hide the modal using Bootstrap 4 method
        $('#addMachineModal').modal('hide');
    });
});

document.getElementById('saveCategoryBtn').addEventListener('click', function () {
    const categoryName = document.getElementById('newCategoryName').value;
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch(addCategoryUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': csrfToken,
        },
        body: new URLSearchParams({
            newCategoryName: categoryName
        }),
    })
    .then(response => response.json())
    .then(data => {
        const categorySelect = document.getElementById('category');
        const newOption = document.createElement('option');
        newOption.value = data.id;
        newOption.textContent = data.name;
        categorySelect.appendChild(newOption);

        // Hide the modal using Bootstrap 4 method
        $('#addCategoryModal').modal('hide');
    });
});
