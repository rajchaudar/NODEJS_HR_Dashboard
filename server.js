// Import necessary modules
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const os = require('os');
const bodyParser = require('body-parser');
const hbs = require('hbs');
const path = require('path');
require('dotenv').config();
const Admin = require('./models/admin');
const bcrypt = require('bcryptjs');
const Employee = require('./models/employee.model');
const connectDB = require('./models/db');
const router = express.Router();
const Department = require('./models/department');
const Promotion = require('./models/Promotion');
// const handlebars = require('handlebars');

connectDB();

const app = express();
const PORT = 3001;

hbs.registerHelper('eq', function(a, b) {
    return a === b;
  });

// Route to render promotion status page
app.get('/PromStatus', (req, res) => {
    Promotion.find({}).then(promotions => {
        res.render('PromStatus', { promotions });
    }).catch(err => {
        console.error('Error fetching promotions:', err);
        res.status(500).send('Failed to fetch promotions');
    });
});

// Set Handlebars as the view engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
hbs.registerHelper('json', function (context) {
    return JSON.stringify(context);
});


// Register the router for the promotion routes
app.use('/promotion', router);


// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Route to render the admin creation form
app.get('/admin/create', (req, res) => {
    res.render('createAdmin');
});

// Route to create admin credentials
app.post('/admin/create', async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            return res.render('adminLogin', { error: 'Admin already exists' });
        }

        const admin = new Admin({ username, password });
        await admin.save();
        // console.log('Admin created:', admin);
        res.redirect('/admin/login');
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).send('Server Error');
    }
});

// Admin login route (GET)
app.get('/admin/login', (req, res) => {
    res.render('adminLogin');
});

// Admin login route (POST)
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body; // Get username and password from the request body

    try {
        // Fetch the admin user from the database
        const admin = await Admin.findOne({ username });

        if (!admin) {
            return res.render('adminLogin', { error: 'Invalid credentials' }); // Admin not found
        }

        // Compare entered password with stored hashed password
        const isMatch = await bcrypt.compare(password, admin.password);

        if (isMatch) {
            req.session.admin = true; // Set admin session
            res.redirect('/'); // Redirect to dashboard after successful login
        } else {
            res.render('adminLogin', { error: 'Invalid credentials' }); // Invalid password
        }
    } catch (error) {
        console.error('Error during admin login:', error);
        res.render('adminLogin', { error: 'Something went wrong, please try again' });
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
        employeeId: req.body.employeeId,
        fullName: req.body.fullName,
        email: req.body.email,
        mobile: req.body.mobile,
        city: req.body.city,
        salary: req.body.salary,
        position: req.body.position || '',
        department: req.body.department
    });console.log('Form data received:', req.body);

    const existingEmployee = await Employee.findOne({ employeeId: req.body.employeeId });
    if (existingEmployee) {
        return res.render('employee/addOrEdit', {
            viewTitle: 'Insert Employee',
            errorMessage: 'Duplicate employee ID',
            employee: req.body 
        });
    }

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

// Example: Fetching departments from a database (e.g., MongoDB)
app.get('/create-employee', async (req, res) => {
    try {
        const departments = await Department.find(); // Adjust this according to your model
        res.render('create-employee', { viewTitle: 'Create Employee', departments });
    } catch (error) {
        console.error("Error fetching departments:", error);
        res.status(500).send("Internal Server Error");
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
            salary: req.body.salary,
            department: req.body.department,
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
    const employeeId = req.params.id; // Define employeeId from route params

    try {
        await Promotion.deleteMany({ employee: employeeId });

        const employee = await Employee.findByIdAndDelete(employeeId);

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

//Route to render the employee creation form
app.get('/employee', isAdmin, (req, res) => {
    res.render('employee/addOrEdit', {
        viewTitle: 'Insert Employee',
        employee: {}
    });
});

// Route to get all departments
app.get('/departments', async (req, res) => {
    try {
        const departments = await Department.find();
        res.json(departments); // Send the departments as JSON
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/employee/:id/edit', async (req, res) => {
    const employee = await Employee.findById(req.params.id).populate('department');
    const departments = await Department.find(); // Fetch departments
    res.render('employee/addOrEdit', { employee, departments, viewTitle: 'Edit Employee' });
});


// // Create a new department
// router.post('/department/create', async (req, res) => {
//     const { name } = req.body;

//     try {
//         const department = new Department({ name });
//         await department.save();
//         res.status(201).json(department);
//     } catch (error) {
//         res.status(500).json({ error: 'Error creating department' });
//     }
// });


// Create a new employee and assign to a department
// router.post('/employee/create', async (req, res) => {
//     const { name, position, departmentId } = req.body;

//     try {
//         const employee = new Employee({ name, position, department: departmentId });
//         await employee.save();

//         // Update department's employee count
//         await Department.findByIdAndUpdate(departmentId, { $inc: { employeeCount: 1 } });

//         res.status(201).json(employee);
//     } catch (error) {
//         res.status(500).json({ error: 'Error creating employee' });
//     }
// });


// Parse JSON body
app.use(express.json()); 

app.post('/promotion/create', async (req, res) => {
    const { employeeId, previousPosition, newPosition } = req.body;

    try {
        // Find and update the employee's position
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Log the promotion
        const promotion = new Promotion({
            employee: employeeId,
            previousPosition,
            newPosition,
            promotionDate: new Date(), 
        });

        await promotion.save(); // Save the promotion to the database

        // Update the employee's position
        employee.position = newPosition;
        await employee.save(); // Save the updated employee

        return res.status(200).json({ message: 'Promotion logged successfully' });
    } catch (error) {
        console.error('Error logging promotion:', error);
        return res.status(500).json({ message: 'Error logging promotion' });
    }
});


// HR Dashboard Route
app.get('/hr-dashboard', async (req, res) => {
    try {
        // Fetch all departments with employee count
        const departments = await Department.find().lean();
        const departmentEmployeeCounts = await Employee.aggregate([
            { $group: { _id: '$department', count: { $sum: 1 } } }
        ]);

        departments.forEach(department => {
            const countData = departmentEmployeeCounts.find(d => d._id && d._id.toString() === department._id.toString());
            department.employeeCount = countData ? countData.count : 0;
        });

        const employees = await Employee.find().populate('department').lean();

        const promotions = await Promotion.find().populate('employee').lean();

        res.render('hr-dashboard', {
            departments,
            employees,
            promotions
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).send('Server Error');
    }
});


app.get('/employee/:id', async (req, res) => {
    const employeeId = req.params.id;
    try {
        const employee = await Employee.findById(employeeId).populate('department');
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json({ position: employee.position, department: employee.department });
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ error: 'Internal server error', details: error });
    }
});

app.get('/PromStatus', (req, res) => {
    res.render('promotions');  // or another view you're using
});

// Promotion logging (creation)
app.post('/log-promotion', async (req, res) => {
    try {
        const promotion = new Promotion({
            employee: req.body.employeeId,
            previousPosition: req.body.previousPosition,
            newPosition: req.body.newPosition,
            promotionDate: req.body.promotionDate,
            status: 'Pending',  // Set status to 'Pending' initially
        });

        await promotion.save();
        res.status(201).json({ message: 'Promotion logged successfully!', promotion });
    } catch (error) {
        console.error('Error logging promotion:', error);
        res.status(500).json({ error: 'Failed to log promotion.' });
    }
});

// Fetch promotions with status
app.get('/promotions', async (req, res) => {
    try {
        const promotions = await Promotion.find()
            .populate('employee', 'fullName')  // Ensure 'fullName' is populated
            .exec();

        // Render the promotions page and pass the promotions data to it
        res.render('promotions', { promotions }); 
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).send('Failed to fetch promotions.');
    }
});

// Update promotion status
app.patch('/promotions/approve/:promotionId', async (req, res) => {
    try {
        const promotion = await Promotion.findById(req.params.promotionId);
        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found' });
        }

        promotion.status = 'Approved'; 
        await promotion.save();
        res.status(200).json({ message: 'Promotion approved successfully', promotion });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error approving promotion' });
    }
});

app.patch('/update-promotion-status/:promotionId', async (req, res) => {
    try {
        const { status } = req.body;
        const promotion = await Promotion.findById(req.params.promotionId);

        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        promotion.status = status;
        await promotion.save();
        res.status(200).json({ message: 'Promotion status updated successfully', promotion });
    } catch (error) {
        console.error('Error updating promotion status:', error);
        res.status(500).json({ error: 'Failed to update promotion status' });
    }
});

// Function to get local IP address
function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const details of iface) {
            if (details.family === 'IPv4' && !details.internal) {
                return details.address;
            }
        }
    }
    return 'localhost';
}

// Start the server
app.listen(PORT, () => {
    const localIPAddress = getLocalIPAddress(); // Get local IP address
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access it at http://localhost:${PORT}`);
    console.log(`Access it on local network at http://${localIPAddress}:${PORT}`);
});