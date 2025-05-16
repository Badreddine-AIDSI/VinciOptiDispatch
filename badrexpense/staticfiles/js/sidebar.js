document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.querySelector(".sidebar-menu");
    const toggleBtn = document.querySelector(".sidebar-toggle");
    const body = document.body;

    if (toggleBtn) {
        toggleBtn.addEventListener("click", function () {
            sidebar.classList.toggle("active");

            // Toggle the class that controls centering
            if (sidebar.classList.contains("active")) {
                body.classList.remove("sidebar-closed");
            } else {
                body.classList.add("sidebar-closed");
            }
        });
    }
});
