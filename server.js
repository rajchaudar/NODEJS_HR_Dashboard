const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const exphbs = require('hbs');
const path = require('path');
const Employee = require('./models/employee.model');

const app = express();
const PORT = 3000;

// Set Handlebars as the view engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

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

// Employee schema and model
const employeeSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    mobile: String,
    city: String
});

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
        res.render('adminDashboard', { message: 'Welcome ' });
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

// Route to display employee list with filtering/searching functionality
app.get('/', async (req, res) => {
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
            default:
                filterCriteria = {}; // No filter, show all
                break;
        }
    }

    try {
        const employees = await Employee.find(filterCriteria);
        res.render('index', {
            list: employees,
            filterBy: filterBy || 'all',
            search: search || ''
        });
    } catch (err) {
        console.error('Error fetching employees:', err);
        res.status(500).send('Internal Server Error');
    }
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