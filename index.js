const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const { MongoClient,ObjectId } = require("mongodb");
// const {ObjectId} = require('mongodb').ObjectID;
const port = process.env.PORT || 4000;
// var assert = require('assert'

const app = express();
require("dotenv").config();

//database connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nlclv.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
  connectTimeoutMS: 30000, 
  // keepAlive: 1,
});

//middlewars
app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload());
// app.use(bodyParser.urlencoded({
//   extended: true
// }));

app.get("/", (req, res) => res.send("Hello World!"));

client.connect((err) => {
    const userCollection = client.db("theArtsyLens").collection("userCollection");
    const serviceCollection = client.db("theArtsyLens").collection("serviceCollection");
    const serviceDetails = client.db("theArtsyLens").collection("serviceDetails");
    const orderCollection = client.db("theArtsyLens").collection("orderCollection");
  
    app.post("/addUser", (req, res) => {
      const name = req.body.name;
      const email = req.body.email;
      const role = req.body.role;
      userCollection.find({ email: email }).toArray((err, users) => {
        if (users && users.length == 0) {
          userCollection
            .insertOne({ name, email, role })
            .then((result) => {
              // console.log(result);
              res.send(result.acknowledged);
            });
        }
      });
    });

    app.post("/getFullUserByEmail", (req, res) => {
      const email = req.body.email;
      userCollection.find({ email: email }).toArray((err, user) => {
        if (user && user.length > 0) {
          res.send(user);
        } else {
          console.log(
            "user not found, server side error -getFullUserByEmail",
            user,
            email,
            err
          );
        }
      });
    });

    app.post("/isServiceCodeExist", (req, res) => {
      const serviceCode = req.body.serviceCode;
      serviceCollection.find({ serviceCode: serviceCode }).toArray((err, service) => {
        if (!err) {
          if (service && service.length > 0) {
            res.send(true);
          } else {
            res.send(false);
          }
        }
      });
    });

    app.post('/addService', (req, res) => {
      const file = req.files.file;
      const name = req.body.name;
      const price = req.body.price;
      const title = req.body.title;
      const serviceCode = req.body.serviceCode;
      const description = req.body.description;
      const newImg = file.data;
      const encImg = newImg.toString('base64');
      var image = {
          contentType: file.mimetype,
          size: file.size,
          img: Buffer.from(encImg, 'base64')
      };
      serviceCollection.insertOne({ name, title, image, price, serviceCode })
          .then(result => {
            serviceDetails.insertOne({ name, title, image, description, price, serviceCode })
            .then(result => {
              res.send(result.acknowledged);
          })
        })
        .catch((error) => {
          assert.isNotOk(error,'Promise error');
          done();
        });
    })

    app.get('/services', (req, res) => {
      serviceCollection.find({})
          .toArray((err, documents) => {
              // res.send(documents);
              res.json({data: documents});
              // console.log(documents);
          })
    })

    app.post("/getFullServiceByServiceCode", (req, res) => {
      const serviceCode = req.body.serviceCode;
      serviceDetails.find({ serviceCode: serviceCode }).toArray((err, service) => {
        if (service && service.length > 0) {
          res.send(service);
        }
      });
    });
    
    app.post('/addOrder', (req, res) => {
      const name = req.body.name;
      const email = req.body.email;
      const address = req.body.address;
      const country = req.body.country;
      const phone = req.body.phone;
      const serviceCode = req.body.serviceCode;
      const status = req.body.status;
      orderCollection.insertOne({ name, email, address, country, phone, serviceCode, statuls })
          .then(result => {
            res.send(result);
          })
        .catch((error) => {
          assert.isNotOk(error,'Promise error');
          done();
        });
    })

    app.get('/orders', (req, res) => {
      orderCollection.find({})
          .toArray((err, orders) => {
              // res.send(documents);
              res.json({data: orders});
              // console.log(documents);
          })
    })

    app.post("/getOudersByEmail", (req, res) => {
      const email = req.body.email;
      orderCollection.find({ email: email }).toArray((err, orders) => {
        if (orders) {
          res.send(orders);
        }
      });
    });

    app.post("/updateStatusByID/:key", (req, res) => {
      const ID = req.body.ID;
      const status = req.body.status;
      console.log(ID,req.params.key,'--')
      orderCollection
        .updateOne({_id: ObjectId(ID)}, { $set: { status: status } })
        .then((response) => {
          res.send(response);
        })
        .catch((err) => console.log(err));
    });

    app.post('/deleteServiceByServiceCode', (req, res) => {
      const serviceCode = req.body.serviceCode;
      serviceCollection.deleteOne({ serviceCode:serviceCode })
          .then(result => {
            serviceDetails.deleteOne({ serviceCode:serviceCode })
            .then(result => {
              console.log(result,'--');
              res.send(result);
          })
        })
        .catch((error) => {
          assert.isNotOk(error,'Promise error');
          done();
        });
    })

    console.log("database connected successfully");
      // client.close();
  });

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})