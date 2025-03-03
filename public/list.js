function confirmDelete(employeeId) {
    const confirmation = confirm("Are you sure you want to delete this employee?");
    if (confirmation) {
        window.location.href = `/employee/delete/${employeeId}`;
    }
}

function formatSalary(amount) {
    if (amount) {
        let num = amount.toString();
        let lastThree = num.slice(-3);
        let otherNumbers = num.slice(0, num.length - 3);
        if (otherNumbers !== '') {
            lastThree = ',' + lastThree;
        }
        return "₹ " + otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
    }
    return "₹ " + amount;
}

function formatAllSalaries() {
    let salaryCells = document.querySelectorAll('.salary');
    salaryCells.forEach(function(cell) {
        let salaryValue = cell.innerText.trim();
        if (!isNaN(salaryValue) && salaryValue !== "") {
            cell.innerText = formatSalary(Number(salaryValue));
        }
    });
}

window.onload = function() {
    formatAllSalaries();
};

$(document).ready(function() {
    $("#employeeTable").DataTable({
        "responsive": true,
        "autoWidth": false,
        "paging": true,
        "ordering": true,
        "searching": true,
        "info": true,
        "buttons": [
            { extend: 'copy', text: 'Copy' },
            { extend: 'csv', text: 'CSV' },
            { extend: 'excel', text: 'Excel' },
            { extend: 'pdf', text: 'PDF' },
            { extend: 'print', text: 'Print' }
        ]
    }).buttons().container().appendTo('#exportButtons');
});