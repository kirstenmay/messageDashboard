const express = require("express");
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/dashboard', { useNewUrlParser: true });
const CommentSchema = new mongoose.Schema({
    name: String,
    comment: String,
}, { timestamps: true });
const Comment = mongoose.model('Comment', CommentSchema);
const MessageSchema = new mongoose.Schema({
    name: String,
    message: String,
    comments: [CommentSchema]
}, { timestamps: true });
const Message = mongoose.model('Message', MessageSchema);
const app = express();
app.use(express.static(__dirname + "/static"));
app.use(express.urlencoded({ extended: true }));
const session = require('express-session');
app.use(session({
    secret: 'keyboardkitteh',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}));
const flash = require('express-flash');
app.use(flash());
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.listen(8000, () => console.log("listening on port 8000"));

app.get('/', (req, res) => {
    Message.find().sort({ 'createdAt': -1 })
        .then(mes => {
            res.render("dashboard", { allmessage: mes });
        })
        .catch(err => res.json(err));
});

app.post('/message', (req, res) => {
    const message = req.body;
    Message.create(message)
        .then(data => {
            res.redirect("/");
        })
        .catch(err => {
            for (var key in err.errors) {
                console.log("We have an error!", err);
                req.flash('mes', err.errors[key].message);
            }
            res.redirect("/");
        })
});

app.post('/comment/:id', (req, res) => {
    const com = req.body;
    Comment.create(com)
        .then(newCom => {
            console.log("~~~~~~~~~~~~~~~~~~~~It worked")
            Message.updateOne({ _id: req.params.id }, { $addToSet: { comments: newCom } })
                .then(data => {
                    console.log("~~~~~~~~~~~~~~~~~~now redirecting after success")
                    res.redirect("/");
                })
                .catch(err => {
                    console.log("~~~~~~~~~~~~~~~~~~~~There was an error on adding to the message comments")
                    res.json(err)
                })
        })
        .catch(err => {
            console.log("~~~~~~~~~~~~~~~~~~~~~~there was a form submission error")
            for (var key in err.errors) {
                console.log("~~~~~~~~~~~~~~~~~~~~~We have an error!", err);
                req.flash('comments', err.errors[key].message);
            }
            res.redirect("/");
        })
    res.redirect("/");
});

app.get('/delete/:id', (req, res) => {
    const { id } = req.params;
    Message.remove({ _id: id })
        .then(deleted => {
            deleted.save();
        })
        .catch(err => res.json(err));
    res.redirect("/");
})