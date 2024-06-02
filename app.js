var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
const db = new sqlite3.Database('db/sqlite.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the SQlite database.');
});
app.get('/clear-users', (req, res) => {
    db.run('DELETE FROM users', [], function(err) {
        if (err) {
            console.error('Error clearing users:', err.message);
            return res.status(500).send('Error clearing users');
        }

        // 重置 ID 的值
        db.run('DELETE FROM sqlite_sequence WHERE name = ?', ['users'], function(err) {
            if (err) {
                console.error('Error resetting ID:', err.message);
                return res.status(500).send('Error resetting ID');
            }

            res.send('All users cleared successfully');
        });
    });
});
app.post('/register', (req, res) => {
    const { phone, password } = req.body;


    db.get('SELECT * FROM users WHERE phone = ?', [phone], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).send('Database error');
        }
        if (row) {
            return res.send("<script>alert('Phone number already exists'); window.location.href = '/register.html';</script>");
        }

        db.run('INSERT INTO users (phone, password) VALUES (?, ?)', [phone, password], function(err) {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).send('Error registering user');
            }

            res.redirect('/index.html');
        });

    });
});
app.post('/login', (req, res) => {
    const { phone } = req.body;


    db.get('SELECT * FROM users WHERE phone = ?', [phone], function (err, row){
        if (err) {
            return res.status(500).send('Error Login User');
        }
        if (!row) {
            return res.send("<script>alert('User not found'); window.location.href = '/index.html';</script>");
        }
        res.redirect(`/login-after.html?phone=${phone}`);
    });
});
app.get('/api', (req, res) => {
    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            return res.status(500).send('Error fetching users');
        }
        res.json(rows);
    });
});

app.post('/check-password', (req, res) => {
    const { phone, password } = req.body;


    db.get('SELECT * FROM users WHERE phone = ?', [phone], function (err, row){
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).send('Error checking password');
        }
        if (!row) {
            return res.send("<script>alert('User not found'); window.location.href = '/login-after.html';</script>");

        }

        if (row.password !== password) {
            return res.send("<script>alert('Incorrect password'); window.location.href = '/login-after.html?phone=" + phone + "';</script>");
        }

        res.redirect('https://reurl.cc/nNxO7v');
    });
});

module.exports = app;
