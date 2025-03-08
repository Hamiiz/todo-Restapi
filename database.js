const mongoose = require('mongoose');
const {Schema} = mongoose
const passportLocalMongoose = require('passport-local-mongoose')

const Dbstring = process.env.DB_STRING;

const connect = async (connstr=Dbstring)=>{
    try{
        await mongoose.connect(connstr)
    } catch(err){
        console.error(`error occured ${err}`)
    }
    
}
const disconnect = async ()=>{
    await mongoose.disconnect()
}

const ItemSchema = new Schema({
    todo:String,
    Lid:String
})
const ListSchema = new Schema({
    title:String,
    todos:[ItemSchema],
    Uid:String
})
const UserSchema = new Schema({
    name:{
        type:String,
        max:20,
        lowercase:true,
        min:3,
        trim:true
    },
    username:{
        unique:true,
        min:3,
        max:20,
        lowercase:true,
        type:String,
    },
    password:{
        type:String,
    },
    lists:[ListSchema],

})
UserSchema.plugin(passportLocalMongoose)

const User = mongoose.model('User',UserSchema)
const List = mongoose.model('List',ListSchema)
const Item = mongoose.model('Item',ItemSchema)


// Export the model
module.exports = {
    User,List,Item,connect,disconnect
};