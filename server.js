const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const exphbs = require('hbs');
const path = require('path'); // Import path
const Employee = require('./models/employee.model'); // Adjust path based on your structure

const app = express();
const PORT = 3000;

// Set Handlebars as the view engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));  // Make sure to define the views directory

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/EmployeeDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false // Add this line
}, (err) => {
    if (!err) {
        console.log('MongoDB Connection Succeeded.');
    } else {
        console.log('Error in DB connection: ' + err);
    }
});

// Root route
app.get('/', (req, res) => {
    res.redirect('/employee/list'); // Redirect to the employee list page
});

// Route to handle form submission
app.post('/employee', (req, res) => {
    const employee = new Employee({
        fullName: req.body.fullName,
        email: req.body.email,
        mobile: req.body.mobile,
        city: req.body.city
    });

    console.log('Form data received:', req.body);

    employee.save((err, doc) => {
        if (!err) {
            console.log('Employee saved successfully');
            res.redirect('/employee/list');
        } else {
            console.error('Error during record insertion:', err);
            res.render('employee/addOrEdit', {
                viewTitle: 'Insert Employee',
                employee: employee,
                emailError: err.email ? err.email.message : ''
            });
        }
    });
});

// Route to display employee list
app.get('/employee/list', (req, res) => {
    Employee.find((err, docs) => {
        if (!err) {
            res.render('employee/list', {
                list: docs
            });
        } else {
            console.error('Error fetching employees:', err);
        }
    });
});

// Route to display the edit form for a specific employee
app.get('/employee/edit/:id', (req, res) => {
    Employee.findById(req.params.id, (err, employee) => {
        if (!err) {
            res.render('employee/addOrEdit', {
                viewTitle: 'Edit Employee',
                employee: employee
            });
        } else {
            console.error('Error fetching employee:', err);
            res.status(500).send('Error fetching employee data');
        }
    });
});

// Route to update an existing employee
app.post('/employee/update/:id', (req, res) => {
    Employee.findByIdAndUpdate(req.params.id, {
        fullName: req.body.fullName,
        email: req.body.email,
        mobile: req.body.mobile,
        city: req.body.city
    }, { new: true }, (err, doc) => {
        if (!err) {
            console.log('Employee updated successfully');
            res.redirect('/employee/list');
        } else {
            console.error('Error during employee update:', err);
            res.status(500).send('Error updating employee data');
        }
    });
});

// Route to delete an employee
app.get('/employee/delete/:id', (req, res) => {
    Employee.findByIdAndRemove(req.params.id, (err) => {
        if (!err) {
            console.log('Employee deleted successfully');
            res.redirect('/employee/list');
        } else {
            console.error('Error during deletion:', err);
        }
    });
});

// Route to render the employee creation form
app.get('/employee', (req, res) => {
    res.render('employee/addOrEdit', {
        viewTitle: 'Insert Employee',
        employee: {}
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});