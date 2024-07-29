const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const bodyParser = require('body-parser');
const app = express();
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3304,
    database: 'notice-boarddb'
});
const storage = multer.diskStorage({
    destination: (req,file,cb) => {
        cb(null, 'public/images');
    },
    filename: (req,file,cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage});
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});
app.use(bodyParser.urlencoded({extended: true}));
const port = 3000;
app.set('view engine','ejs');
app.use(express.static('public'));
app.use(express.urlencoded({
    extended: false
}));
app.use(express.static('public'));

app.get('/', function(req, res) {
    res.render('index');
});
app.get('/browse', function(req, res) {
    const sql = 'SELECT * FROM posts'
    connection.query(sql,(error,results) => {
        if (error){
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving posts');
        }
        res.render('browse',{posts: results})
    });
});
app.get('/viewall', function(req, res) {
    const sql = 'SELECT * FROM posts'
    connection.query(sql,(error,results) => {
        if (error){
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving posts');
        }
        res.render('viewall',{posts: results})
    });
});
app.get('/contact', function(req, res) {
    res.render('contact');
});
app.get('/about', function(req, res) {
    res.render('about');
});
app.get('/browse/:id', function(req, res) {
    const postId = parseInt(req.params.id);
    const sql = 'SELECT * FROM posts WHERE postid = ?';
    connection.query(sql,[postId],(error,results)=>{
        if (error){
            console.error('Database query error:',error.message);
            return res.status(500).send('Error Retrieving post by ID');
        }
        if (results.length>0){
            res.render('postview',{post:results[0]});
        }
        else{
            res.status(404).send('Post not found');
        }
    });
});

app.get('/createpost',function(req,res) {
    res.render('postadd');
});
app.post('/newpost', upload.single('imgadd'),function(req,res){
    const {newname,newdate,newtime,location,duravalue,x,y,duraunit} = req.body;
    let imgadd;
    if (req.file){
        imgadd = req.file.filename;
    }else{
        imgadd = null;
    }
    const [hr, mn] = newtime.split(':');
    const formathr = ('0' + hr).slice(-2);
    const formatmn = ('0' + mn).slice(-2);
    const formattime = `${formathr}:${formatmn}`;
    const dt = `${newdate}T${formattime}`;
    const duration = `${duravalue} ${duraunit}`;
    const sql ='INSERT INTO posts (name,content,dt,location,duration,x,y) VALUES (?,?,?,?,?,?,?)';
    connection.query(sql,[newname,imgadd,dt,location,duration,x,y],(error,results)=>{
        if (error){
            console.error("Error adding post:",error);
            res.status(500).send('Error adding post');
        }else{
            res.redirect('/browse');
        }
    });
});
app.get('/browse/:id/delete', function(req,res){
    const deleteid = parseInt(req.params.id);
    const sql = 'DELETE FROM posts WHERE postid = ?';
    connection.query(sql,[deleteid],(error,results) => {
        if (error){
            console.error("Error deleting post:", error);
            res.status(500).send('Error deleting post');
        } else {
            res.redirect('/browse');
        }
    });
});
app.get('/browse/:id/update', function(req,res){
    const updateid=parseInt(req.params.id);
    const sql = 'SELECT * FROM posts WHERE postid = ?';
    connection.query( sql, [updateid], (error,results) => {
        if (error){
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving post by ID');
        }
        if (results.length > 0 ){
            res.render('postedit',{updatepost:results[0]});
        }else{
            res.status(404).send('Post not found');
        }
    });
});
app.post('/browse/:id/update', upload.single('newimg'), function(req,res){
    const updateid = req.params.id;
    const {newname,newdate,newtime,location,duravalue,x,y,duraunit} = req.body;
    let image = req.body.oldimg;
    if (req.file){
        image = req.file.filename;
    }
    const [hr, mn] = newtime.split(':');
    const formathr = ('0' + hr).slice(-2);
    const formatmn = ('0' + mn).slice(-2);
    const formattime = `${formathr}:${formatmn}`;
    const dt = `${newdate}T${formattime}`;
    const duration = `${duravalue} ${duraunit}`;
    const sql = 'UPDATE posts SET name = ?, content = ?, dt = ?, location = ?, duration = ?, x = ?, y = ? WHERE postid = ?';
    connection.query(sql,[newname,image,dt,location,duration,x,y,updateid], (error,results)=>{
        if (error){
            console.error("Error updating post:", error);
            res.status(500).send('Error updating post');
        } else {
            res.redirect('/viewall');
        }
    });
});

app.get('/viewcontact', function(req,res){
    const sql = 'SELECT * FROM contact'
    connection.query(sql,(error,results) => {
        if (error){
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving Feedback');
        }
        res.render('contactviewall',{contact: results})
    });
})

app.post('/submitfeedback', function(req,res) {
    const {email,type,details}=req.body;
    const sql ='INSERT INTO contact (email,contacttype,details) VALUES (?,?,?)';
    connection.query(sql,[email,type,details],(error,results)=>{
        if (error){
            console.error("Error adding Feedback:",error);
            res.status(500).send('Error adding Feedback');
        }else{
            res.render('feedbackconfirm');
        }
    });
});

app.get('/feedback/view/:id',(req,res)=>{
    const contactid = req.params.id;
    const sql = 'SELECT * FROM contact WHERE contactid = ?';
    connection.query(sql,[contactid],(error,results)=>{
        if (error){
            console.error('Database query error:',error.message);
            return res.status(500).send('Error Retrieving contact by ID');
        }
        if (results.length>0){
            res.render('onecontact',{contact:results[0]});
        }
        else{
            res.status(404).send('Contact not found');
        }
    });
});

app.get('/feedback/edit/:id', (req,res) => {
    const contactid = req.params.id;
    const sql = 'SELECT * FROM contact WHERE contactid = ?';
    connection.query( sql, [contactid], (error,results) => {
        if (error){
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving contact by ID');
        }
        if (results.length > 0 ){
            res.render('editcontact',{contact:results[0]});
        }else{
            res.status(404).send('Contact not found');
        }
    });
});

app.post('/editcontact/:id',(req,res) => {
    const contactid = req.params.id;
    const {email,contacttype,details}=req.body;
    const sql = 'UPDATE contact SET email = ?, contacttype = ?, details = ? WHERE contactid = ?';
    connection.query(sql,[email,contacttype,details, contactid], (error,results)=>{
        if (error){
            console.error("Error updating contact:", error);
            res.status(500).send('Error updating contact');
        } else {
            res.redirect('/viewcontact');
        }
    });
});

app.get('/deletecontact/:id',(req,res) => {
    const contactid = req.params.id;
    const sql = 'DELETE FROM contact WHERE contactid = ?';
    connection.query(sql,[contactid],(error,results) => {
        if (error){
            console.error("Error deleting contact:", error);
            res.status(500).send('Error deleting contact');
        } else {
            res.redirect('/viewcontact');
        }
    })
})

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

