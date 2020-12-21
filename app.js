const ex = require('express')
const app=ex()
const mongoose = require('mongoose')
const bp = require('body-parser')
var nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config()
const sha256 = require('crypto-js/sha256')
const cors = require('cors')
app.use(cors({origin:'http://localhost:3000',credentials:true}))

app.use(bp.json())

mongoose.connect(process.env.URL,{useUnifiedTopology:true,useCreateIndex:true,useNewUrlParser:true,useFindAndModify:true})
.then(()=>{
    console.log("Mongo Db Connected successfully")
})
.catch((err)=>{
    console.log(err)
})

var uuidMap = new Map()

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    }
})

const User = mongoose.model('User',userSchema)



var transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "b88c8d9ae4c993",
      pass: "0561075baa00ea"
    }
  });
  






app.post('/checkConnection',(req,res)=>{
    console.log('connected')
    res.send(true)
})

const hashPass = (password)=>{
    return new Promise((resolve,reject)=>{
        resolve(sha256(password))
    })
}

app.post('/forgetRequest',(req,res)=>{
    const emailId = req.body.emailId
    const uuid=uuidv4()
    uuidMap.set(uuid,emailId)
    console.log(uuid)
    User.findOne({username:emailId})
    .then((doc)=>{
        var mailOptions = {
            from: 'Lovedeepschhoker@gmail.com',
            to: emailId,
            subject: 'Reset Password Link',
            text: 'Please visit this link to reset your password : http://localhost:9000/resetpassword/'+uuid.toString() 
          };
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
              res.send({status:false})
            } else {
              console.log('Email sent: ' + info.response);
              res.send({status:true})
            }
          });
    })
    .catch((err)=>{
        console.log(err)
        res.send({status:false,payload:'notfound'})
    })
    

})

app.post('/resetPassword',async (req,res)=>{
    const uuid=req.body.uuid
    const newPassword= await hashPass(req.body.password)
    console.log(uuid)
    User.findOneAndUpdate({username:uuidMap.get(uuid)},{password:newPassword})
    .then((doc)=>{
        res.send({status:true})
        uuidMap.delete(uuid)
    })
    .catch((err)=>{
        res.send({status:false})
    })
    
})

app.post('/checkuuid',(req,res)=>{
    if(uuidMap.has(req.body.uuid)){
        res.send({status:true})
    }
    else{
        res.send({status:false})
    }
})



app.post('/signup',async (req,res)=>{
    const body= req.body
    const hashPassword= await hashPass(body.password)

    const newUser = new User({
        username:body.username,
        password:hashPassword
    })

    newUser.save()
    .then((doc)=>{
        res.send({status:true, payload:doc})
    })
    .catch((err)=>{
        res.send({status:false})
    })


})

app.post('/login',(req,res)=>{
    const body = req.body
    console.log(body)
    User.findOne({username:body.username})
    .then((doc)=>{
        console.log(doc)
        if(doc.password==sha256(body.password)){
            res.send({status:true,payload:doc})
        }
        else{
            res.send({status:false,payload:"password"})
        }
    })
    .catch((err)=>{
        console.log(err)
        res.send({status:false,payload:'username'})
    })
})



app.listen(9000,(req,res)=>{
    console.log("This is listening")
})




