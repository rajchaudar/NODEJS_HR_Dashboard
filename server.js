const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const exphbs = require('hbs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Set Handlebars as the view engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// MongoDB connection
async function connectDB() {
    try {
        await mongoose.connect('mongodb://localhost:27017/EmployeeDB', {

        });
        console.log('MongoDB Connection Succeeded.');
    } catch (error) {
        console.log('Error in DB connection: ' + error);
    }
}

connectDB();

// Employee schema and model
const employeeSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        unique: true // Ensure employeeId is unique
    },
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        match: [/.+\@.+\..+/, 'Please enter a valid email address']
    },
    mobile: {
        type: String,
        required: true,
        match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number']
    },
    city: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    salary: {
        type: Number,
        required: true,
        min: [0, 'Salary cannot be negative']
    }
});

const Employee = mongoose.model('Employee', employeeSchema);

// Admin login route
app.get('/admin/login', (req, res) => {
    res.render('adminLogin');  // Ensure 'adminLogin.hbs' exists in 'views' folder
});

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    // Hardcoded credentials check
    if (username === 'admin' && password === 'admin123') {
        req.session.admin = true;
        res.redirect('/');
    } else {
        res.render('adminLogin', { error: 'Invalid credentials' });
    }
});

// Protected routes (require admin login)
app.get('/', (req, res) => {
    if (req.session.admin) {
        res.render('adminDashboard', { message: 'Welcome Admin' });
    } else {
        res.redirect('/admin/login');
    }
});

// Middleware to check if admin is logged in
function isAdmin(req, res, next) {
    if (req.session && req.session.admin) {
        return next();
    } else {
        res.redirect('/admin/login');
    }
}

// Route to handle form submission
app.post('/employee', async (req, res) => {
    const employee = new Employee({
        fullName: req.body.fullName,
        email: req.body.email,
        mobile: req.body.mobile,
        city: req.body.city,
        salary: req.body.salary, // Make sure these fields exist in your schema
        position: req.body.position,
        employeeId: req.body.employeeId
    });
    console.log('Form data received:', req.body);

    try {
        await employee.save();
        console.log('Employee saved successfully');
        res.redirect('/employee/list');
    } catch (err) {
        console.error('Error during record insertion:', err);
        res.render('employee/addOrEdit', {
            viewTitle: 'Insert Employee',
            employee: employee,
            emailError: err.email ? err.email.message : ''
        });
    }
});

// Route to display employee list with filtering/searching functionality
app.get('/employee/list', async (req, res) => {
    const { filterBy, search } = req.query;

    let filterCriteria = {};

    if (search && filterBy) {
        switch (filterBy) {
            case 'name':
                filterCriteria = { fullName: { $regex: new RegExp(search, 'i') } };
                break;
            case 'email':
                filterCriteria = { email: { $regex: new RegExp(search, 'i') } };
                break;
            case 'mobile':
                filterCriteria = { mobile: { $regex: new RegExp(search, 'i') } };
                break;
            case 'city':
                filterCriteria = { city: { $regex: new RegExp(search, 'i') } };
                break;
            case 'position':
                filterCriteria = { position: { $regex: new RegExp(search, 'i') } };
                break;
            default:
                filterCriteria = {};
                break;
        }
    }

    try {
        const employees = await Employee.find(filterCriteria);
        res.render('employee/list', {
            list: employees,
            filterBy: filterBy || 'all',
            search: search || ''
        });
    } catch (err) {
        console.error('Error fetching employees:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Route to display the edit form for a specific employee
app.get('/employee/edit/:id', isAdmin, async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (employee) {
            res.render('employee/addOrEdit', {
                viewTitle: 'Edit Employee',
                employee: employee
            });
        } else {
            res.status(404).send('Employee not found');
        }
    } catch (err) {
        console.error('Error fetching employee:', err);
        res.status(500).send('Error fetching employee data');
    }
});

// Route to update an existing employee
app.post('/employee/update/:id', isAdmin, async (req, res) => {
    try {
        const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, {
            employeeId: req.body.employeeId,
            fullName: req.body.fullName,
            email: req.body.email,
            mobile: req.body.mobile,
            city: req.body.city,
            position: req.body.position,
            salary: req.body.salary
        }, { new: true });

        if (updatedEmployee) {
            console.log('Employee updated successfully');
            res.redirect('/employee/list');
        } else {
            res.status(404).send('Employee not found');
        }
    } catch (err) {
        console.error('Error during employee update:', err);
        res.status(500).send('Error updating employee data');
    }
});

// Route to delete an employee
app.get('/employee/delete/:id', isAdmin, async (req, res) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);

        if (!employee) {
            console.log('No employee found with that ID');
            return res.status(404).send('Employee not found');
        }

        console.log(`Employee ${employee.fullName} deleted successfully.`);
        res.redirect('/employee/list?success=true'); // Redirect with success message
    } catch (err) {
        console.error('Error during deletion: ', err);
        res.status(500).send('Error deleting employee');
    }
});

// Route to render the employee creation form
app.get('/employee', isAdmin, (req, res) => {
    res.render('employee/addOrEdit', {
        viewTitle: 'Insert Employee',
        employee: {}
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});