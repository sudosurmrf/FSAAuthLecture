import express from 'express';
import pg from 'pg';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt';

const client = new pg.Client(process.env.DATABASE_URL || 'the pg database credentials');
const app = express();
const PORT = process.env.PORT;

client.connect();
app.use(express.json());


const verifyToken = () => {
  const authHeader = req.headers['Authorization'];
  const token = authHeader.split(' ')[1];
  const decodedJWT = jwt.verify(token, process.env.JWT_SECRET);

  req.user = decodedJWT
  next();
}


app.get('/', async(req,res,next) => {
  try {
    const allUsers = await client.query(`SELECT * FROM user`);
    if(!allUsers) return res.status(404).send('cant find users');

    res.status(200).json(allUsers);
  }catch(err){
    console.log(err)
    res.status(400).send('cant find the info');
  }
})

app.post('/register', async(req,res,next) => {
  const {email, password, name} = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 5)
    const newUser = await client.query(`INSERT INTO user (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING *;`,[name, email, hashedPassword]);

    if(!newUser) return res.status(401).send('could not make new user');
    const token = jwt.sign({id: newUser.id, email: newUser.email}, process.env.JWT_SECRET);
    res.status(201).json(token)

  }catch(err){
    console.log(err);
    res.send('error registering')
  }
})

app.post('/login', async(req,res,next) => {
  const {email, password} = req.body;
  try {
    const realUserInfo = await client.query(`SELECT * FROM user WHERE email = $1;`, [email]);

    const isPWMatch = await bcrypt.compare(password, realUserInfo.password);
    if(!isPWMatch) return res.status(401).send('not authorized');
    const token = jwt.sign({id: realUserInfo.id, email: realUserInfo.email});
    res.status(201).json(token);
  }catch(err){
    console.log('could not log in')
  }
})

//this is our protected route that requires a valid verification to access. 
app.get('/favorite-relatives', verifyToken, async(req,res,next) => {
  try {
    const favRelatives = await client.query(`SELECT * FROM user WHERE favorite = true`);
    if(!favRelatives) return res.status(404).send('cant find relatives');
    res.status(201).json(favRelatives);
  }catch(err){
    console.log(err);
    res.send('error getting favorites');
  }
})


app.listen(PORT, ()=> {
  console.log(`listening on ${PORT}`)
})

