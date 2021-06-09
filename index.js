const express = require("express");
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
require('dotenv').config();


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fmj9c.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


const port = 5000;

//mongo credentials
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();

// parse application/x-www-form-urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

//firebase

const admin = require("firebase-admin");
const serviceAccount = require("./configs/burj-al-arab-1d1c3-firebase-adminsdk-ss0eb-3c1a79bdc2.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});



//Mongo connection for the database
client.connect((err) => {
  const bookings = client.db("burjAlArab").collection("bookings");
  // perform actions on the collection object
  // client.close();
  console.log("db connected");

  // Root API  
  app.get('/', (req, res) => {
    res.send('Error: 403, Access Denied.')
  })

  //booking data to send to server
  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  //read / get / load data from server FOR ALL DATA
  app.get("/bookings", (req, res) => {
    const bearer = req.headers.authorization;
   if (bearer && bearer.startsWith('Bearer ')) {
    const idToken = bearer.split(" ")[1];
    // console.log({ idToken });
    admin.auth().verifyIdToken(idToken)
      .then((decodedToken) => {
        const tokenEmail = decodedToken.email;
        
        if (tokenEmail == req.query.email) {
            bookings.find({ email: req.query.email }).toArray((err, documents) => {
                res.status(200).send(documents);
              });
        } else {
            res.status(401).send('unauthorized aceess')
        }
      })
      .catch((error) => {
        // Handle error
      });
   } else {
       res.status(401).send('unauthorized aceess')
   }

    
  });
});

app.listen(port, console.log("Server is live..."));
