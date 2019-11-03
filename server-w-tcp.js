/**
 * Important note: this application is not suitable for benchmarks!
 */

var http = require('http')
  , net = require('net')
  , url = require('url')
  , fs = require('fs')
  , bodyParser = require('body-parser')
  , mongodb = require('mongodb')
  , io = require('socket.io')
  , sys = require(process.binding('natives').util ? 'util' : 'sys')
  , server
  , express = require('express')
  , HashMap = require('hashmap');
  
var tcpGuests = [];
var chatGuests = [];
var arduinoList = new HashMap();
let users;
let arduinos;
let api_keys;
app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin' , '*');
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append("Access-Control-Allow-Headers", "Origin, Accept,Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
  res.append('Access-Control-Allow-Credentials', true);
  next();
});


const MongoClient = mongodb.MongoClient;

MongoClient.connect('mongodb://oguz.ulku:Ou.1301171025@ds311128.mlab.com:11128/heroku_mj4zvqd1', (err, Database) => {
    if(err) {
        console.log(err);
        return false;
    }
    console.log("Connected to MongoDB");
    const db = Database.db("heroku_mj4zvqd1");
    users = db.collection("users");
    arduinos = db.collection("arduinos");
    api_keys = db.collection("api-keys");


}); 

app.post('/api/register', (req, res, next) => {
  let user = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password
  };
  let count = 0;    
  users.find({}).toArray((err, Users) => {
      if (err) {
          console.log(err);
          return res.status(500).send(err);
      }
      for(let i = 0; i < Users.length; i++){
          if(Users[i].username == user.username)
          count++;
      }
      // Add user if not already signed up
      if(count == 0){
          users.insert(user, (err, User) => {
              if(err){
                  res.send(err);
              }
              res.json(User);
          });
      }
      else {
          // Alert message logic here
          res.json({ user_already_signed_up: true });
      }
  });
  
});

app.post('/api/login', (req, res) => {
  let isPresent = false;
  let correctPassword = false;
  let loggedInUser;

  users.find({}).toArray((err, users) => {
      if(err) return res.send(err);
      users.forEach((user) => {
          if((user.username == req.body.username)) {
              if(user.password == req.body.password) {
                  isPresent = true;
                  correctPassword = true;
                  loggedInUser = {
                      username: user.username,
                      email: user.email
                  }    
              } else {
                  isPresent = true;
              }
          }
      });
          res.json({ isPresent: isPresent, correctPassword: correctPassword, user: loggedInUser });
  });
});

app.post('/api/api-key-generated', (req, res) => {
 
  let api_key = {
    username: req.body.username,
    arduinoname: req.body.arduinoname,
    apikey: req.body.apikey
};
let count = 0;    
users.find({}).toArray((err, Users) => {
    if (err) {
        console.log(err);
        return res.status(500).send(err);
    }
    for(let i = 0; i < Users.length; i++){
        if(Users[i].username == user.username)
        count++;
    }
    // Add user if not already signed up
    if(count == 0){
        users.insert(user, (err, User) => {
            if(err){
                res.send(err);
            }
            res.json(User);
        });
    }
    else {
        // Alert message logic here
        res.json({ user_already_signed_up: true });
    }
});
});

app.post('/api/arduino/add-arduino', (req, res) => {
 
  let arduino = {
    username: req.body.username,
    arduinoname: req.body.arduinoname,
    arduinoapikey: req.body.arduinoapikey,
    arduinotype: req.body.arduinotype,
    arduinoactive: req.body.arduinoactive,
    arduinocommand: req.body.arduinocommand
};
let count = 0;    
arduinos.find({}).toArray((err, Arduino) => {
    if (err) {
        console.log(err);
        return res.status(500).send(err);
    }
   
        arduinos.insert(arduino, (err, Arduino) => {
            if(err){
                res.send(err);
            }
            res.json(Arduino);
        });
    
   
});
});


app.post('/api/arduino/get-arduino', (req, res) => {
 
 

let arduinoList = [];
  


 
arduinos.find({}).toArray((err, arduinos) => {
  if(err) return res.send(err);
  arduinos.forEach((arduino) => {
    let _arduino = {
      arduinoid:'',
      username:'',
      arduinoname:'',
      arduinoapikey:'',
      arduinotype:'',
      arduinoactive:'',
    arduinocommand:'' };
      if((arduino.username == req.body.username)) {
        _arduino.arduinoid = arduino._id.toString();
        _arduino.username = arduino.username;
        _arduino.arduinoactive = arduino.arduinoactive;
        _arduino.arduinoapikey = arduino.arduinoapikey;
        _arduino.arduinoname = arduino.arduinoname;
        _arduino.arduinotype = arduino.arduinotype;
        _arduino.arduinocommand = arduino.arduinocommand;
        arduinoList.push(_arduino);
      }
  });
      res.json({ arduinoList: arduinoList });
});
});

server = http.Server(app),

send404 = function(res){
  res.writeHead(404);
  res.write('404');
  res.end();
};

server.listen(8090);



// socket.io, I choose you
// simplest chat application evar
var io = io.listen(server)
  , buffer = [];
  
io.on('connection', function(client){
  client.send({ buffer: buffer });
  client.broadcast.send({ announcement: client.sessionId + ' connected' });
  
  chatGuests.push(client);
  
  client.on('message', function(message){
    var msg = { message: [client.sessionId, message] };
    buffer.push(msg);
    if (buffer.length > 15) buffer.shift();
    client.broadcast.send(msg);
    let soc = arduinoList.get(message.e.arduinoapikey);
if(soc !== undefined){
  if(message.arduinocommand === 'a'){
    soc.write('a');
  }
 else if(message.arduinocommand === 'k'){
  soc.write('k');
 }
}
  
    //send msg to tcp connections
    // for (g in tcpGuests) {
    //     tcpGuests[g].write('a');
    // }
  });

  client.on('disconnect', function(){
    client.broadcast.send({ announcement: client.sessionId + ' disconnected' });
  });
});

//tcp socket server
var tcpServer = net.createServer(function (socket) {
  console.log('tcp server running on port 1337');
  console.log('web server running on http://localhost:8090');
});

tcpServer.on('connection',function(socket){
    socket.write('connected to the tcp server\r\n');
    console.log('num of connections on port 1337: ' + tcpServer.connections);
    
    tcpGuests.push(socket);
    
    socket.on('data',function(data){
        console.log('received on tcp socket:'+data);
        socket.write('msg received\r\n');
        arduinoList.set(data.toString().trim() , socket)
        
        for (g in chatGuests) {
          var client = chatGuests[g];
          client.send({message:["data",data.toString('ascii',0,data.length)]});
          client.emit('message',{
            greeting: 'Hello Oguz.'
        });
          
      }

        //send data to guest socket.io chat server
        for (g in io.clients) {
            var client = io.clients[g];
            client.send({message:["data",data.toString('ascii',0,data.length)]});
            
        }
    })
});
tcpServer.listen(1337);

