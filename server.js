require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose')
const db = require(`${__dirname}/database.js`)
const session = require('express-session')
const passport = require('passport')
const { User } = require('./database');

const app = express();
const port = 3000;

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true 
}));
app.use(express.json());

app.use(session({
    secret:process.env.JWT_SECRET,
    resave:false,
    saveUninitialized:false,
    cookie:{secure:false}
}))
app.use(passport.initialize())
app.use(passport.session())
passport.use(db.User.createStrategy())
passport.serializeUser(db.User.serializeUser())
passport.deserializeUser(db.User.deserializeUser())


app.get('/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.status(200).send({ authenticated: true, user: req.user });
    } else {
        res.status(200).send({ authenticated: false });
    }
});
app.route('/signup')
.get(async (req, res) => {

    try{
    
        let users = await db.User.find({})
        res.send(users).status(200)
    }catch(err){
        res.send(err).status(500)
    }
    
    
})
.post(async (req, res) => {
    
    try{
      
        let user =await db.User.findOne({username:req.body.username}) 
        if (user == null){
            try{
                const {username,name,password} = req.body
                const newuser = new db.User({username,name})
                User.register(newuser,req.body.password,(err,user)=>{
                    if(err){
                        console.error(err)
                    }else{
                        passport.authenticate('local')(req,res,()=>{
                            console.info('User created');
                            res.send(user).status(200)
                        })
                    }
                })
                
             

            }catch(err){
                console.error(`error creating user ${err}`)

            }
        }else{
            res.send('User already exists').status(400)
        }  


    }catch(err){
        res.send(err).status(500)
    }

    
});
app.route('/login')
.get(async (req, res) =>{
    if (req.isAuthenticated()) {
        return res.status(200).send({ authenticated: true, user: req.user });
    }
})
.post(async (req, res) => {
    try{
       
        let user = new db.User(req.body)
        req.logIn(user,async(err)=>{
                if(err){
                    console.error(err)
                }else{
                    await passport.authenticate('local')(req,res,()=>{
                        console.info('User logged in');
                        
                        res.send(user).status(200)
                    })
                }
        })  
    }catch(err){
        res.send(err).status(500)
    }});
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).send(err);
        }
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.status(200).send('Logged out');
        });
    });
});
app.route('/:Uid/lists')
.get(async (req, res) => {

   console.log(req.isAuthenticated())
    let Uid = req.params.Uid
    if (!req.isAuthenticated()) {
        return res.status(401).send({ error: 'Unauthorized' });
    }

    if (req.user.username !== Uid) {
        return res.status(403).send({ error: 'Forbidden' });
    }
   
    try{
        await db.connect()
       let user = await db.User.findOne({username:Uid})
        lists = user.lists
        res.send(lists).status(200)
    }catch(err){
        res.send(err).status(500)
    }
})
.post(
    async (req, res) => {
    try{
        let list = new db.List(req.body)
        await list.save()
        let user = await db.User.findOneAndUpdate({username:req.params.Uid},{$push:{lists:list}})
        res.send(list).status(200)
    }catch(err){
        res.send(err).status(500)
    }
});
app.route('/:Uid/:Lid')
.get(async (req, res) => {  
    console.log(req.method + ' Accessed');
    try {
  
        let list = await db.List.findOne({ title: req.params.Lid });
        
        if (!list) {
            return res.status(404).send({ error: 'List not found' });
        }

        let todos = list.todos;
        res.status(200).send(list);
    } catch (err) {
        console.error('Error fetching list:', err); 
        res.status(500).send(err);
    } 
})
.post(async (req, res) => {
    try{
        console.log(req.method+' Accessed')
        let todo = new db.Item(req.body)
        await todo.save()
        let list = await db.List.findOneAndUpdate({title:todo.Lid},{$push:{todos:todo}})
        res.send(list).status(200)
    }catch(err){
        res.send(err).status(500)
    }
})
.delete(async (req, res) => {
    let todo = req.body.todo
    try{
        console.log(req.method+' Accessed')
        let list = await db.List.findOneAndUpdate(
            { title: req.params.Lid },
            { $pull: { todos: { _id: todo._id } } },
            { new: true }
        );
        if (!list) {
            return res.status(404).send({ error: 'List not found' });
        }
        await db.Item.findByIdAndDelete(todo._id);
        res.send(list).status(200);
    }catch(err){
        res.send(err).status(500)
    }
});
app.route('/deletelist/:Uid/:Lid')
.delete(async (req, res) => {
    try{
        console.log(req.method+' Accessed')
        let list = await db.List.findOneAndDelete({title:req.params.Lid})
        let user = await db.User.findOneAndUpdate({username:req.params.Uid},{$pull:{lists:{title:req.params.Lid}}})
        res.send(list).status(200)
    }catch(err){
        res.send(err).status(500)
    }
})


db.connect().then(()=>{
    app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
})
