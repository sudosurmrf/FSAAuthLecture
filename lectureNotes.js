//jwt = jsonwebtoken

import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt';
import {verifyToken} from './here'

const myName = await dq.query(`SELECT * FROM User WHERE id=1`)

const token = jwt.sign({name: `${myName.first_name}`, id: myName.id},process.env.JWT_SECRET)

res.send(token)

fetch(`myApi.com`,{
  method: 'POST',
  headers: {'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }
})


export const verifyToken = () => {
  const authHeader = req.headers['Authorization'];
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  
  req.user = decoded
  next();
}

const isFavoriteCheck = () => {
  const authHeader = req.headers['Authorization'];
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if(decoded.isFavorite !== true){
    return res.status(401).send('not authorized');
  }
  next();
}


app.get('/otherPeople', verifyToken, isFavoriteCheck, async(req,res,next) => {
  if(!req.user){
    return res.send('not authorized')
  }
})


app.post('/register', isFavoriteCheck, async(req,res,next) => {
  const {name, email, password} = req.body;
  const hashedPassword = await bcrypt.hash(password, 5);

  const addUserIntoDb = await db.query(`INSERT INTO user (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING *;`, [name, email, hashedPassword])
  
    if(!addUserIntoDb) {
      return res.status(402).send('could not create the new user');
    }
  const token = jwt.sign({id: addUserIntoDb.id, name:addUserIntoDb.name}, process.env.JWT_SECRET);
  res.status(201).json(token);
});


//bcrypt
app.post('/login', verifyToken, async(req,res,next) => {
  const {email, password} = req.body;
  try {
    const realUserInfo = await db.query(`SELECT * FROM user WHERE email=$1`,[email]);
    const isMatch = await bcrypt.compare(password, realUserInfo.password);
    if(!isMatch){
      return res.status(401).send('wrong info');
    }
    const token = jwt.sign({id: realUserInfo.id, name:realUserInfo.first_name}, process.env.JWT_SECRET);
    res.status(200).json(token);
  }catch(err){
    console.log(err);
  }
})







