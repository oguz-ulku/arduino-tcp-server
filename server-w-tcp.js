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
  , HashMap = require('hashmap')
  , ObjectID = require('mongodb').ObjectID; ;
  
var tcpGuests = [];
var chatGuests = [];
var arduinoList = new HashMap();
let users;
let arduinos;
let api_keys;
let type_list;
app = express();
let restApiPort =  8090;
let tcpServerPort = process.env.PORT || 1337;


app.use(bodyParser.json());

app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin' , '*');
  res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.append("Access-Control-Allow-Headers", "Origin, Accept,Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
  res.append('Access-Control-Allow-Credentials', true);
  next();

});


const MongoClient = mongodb.MongoClient;

MongoClient.connect('mongodb://127.0.0.1:27017', {useUnifiedTopology: true}, (err, Database) => {
    if(err) {
        console.log(err);
        return false;
    }
    console.log("Connected to MongoDB");
    const db = Database.db("arduino-tcp-server-db");
    users = db.collection("users");
    arduinos = db.collection("arduinos");
    api_keys = db.collection("api-keys");
    type_lists = db.collection("arduino-type-list");

}); 

app.post('/api/check-user-name', (req, res, next) => {
  let errorResult = '';
  let user = {
      userName: req.body.userName
  };
  let count = 0;    
  users.find({}).toArray((err, Users) => {
      if (err) {
          console.log(err);
          return res.status(500).send(err);
      }
      for(let i = 0; i < Users.length; i++){
          if(Users[i].userName == user.userName){
            count++;
            errorResult = 'User name : ' + user.userName + ' allready exist.'
            break;
          }
           
      }
      //  sdd Add user if not already signed up
      if(count == 0){
        errorResult = 'User name : ' + user.userName + ' usable.'
        res.json({ userNameCheck: true, message: errorResult });
      }
      else {
          // Alert message logic here
          res.json({ userNameCheck: false, message: errorResult });
      }
  });
  
});

app.post('/api/check-email', (req, res, next) => {
  let errorResult = '';
  let user = {
      email: req.body.email
  };
  let count = 0;    
  users.find({}).toArray((err, Users) => {
      if (err) {
          console.log(err);
          return res.status(500).send(err);
      }
      for(let i = 0; i < Users.length; i++){
          if(Users[i].email == user.email){
            count++;
            errorResult = 'E-mail address : ' + user.email + ' allready exist.'
            break;
          }
           
      }
      //  sdd Add user if not already signed up
      if(count == 0){
        errorResult = 'E-mail address : ' + user.email + ' usable.'
        res.json({ emailCheck: true, message: errorResult });
      }
      else {
          // Alert message logic here
          res.json({ emailCheck: false, message: errorResult });
      }
  });
  
});

app.post('/api/register', (req, res, next) => {
  let errorResult = '';
  let user = {
      userName: req.body.userName,
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      role: req.body.role,
      token: req.body.token,
      isActive: req.body.isActive
  };
  let count = 0;    
  users.find({}).toArray((err, Users) => {
      if (err) {
          console.log(err);
          return res.status(500).send(err);
      }
      for(let i = 0; i < Users.length; i++){
          if(Users[i].userName == user.userName){
            count++;
            errorResult = 'User name : ' + user.userName + ' allready exist.'
            break;
          }
           
          if(Users[i].email == user.email){
            count++;
            errorResult = 'E-mail address : ' + user.email + ' allready exist.'
            break;
          }
      }
      //  sdd Add user if not already signed up
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
          res.json({ user_already_signed_up: true, message: errorResult });
      }
  });
  
});



app.post('/api/login', (req, res) => {
  let isPresent = false;
  let correctPassword = false;
  let isActive = false;
  let loggedInUser;

  users.find({}).toArray((err, users) => {
      if(err) return res.send(err);
      users.forEach((user) => {
          if((user.userName == req.body.userName)) {
              if(user.password == req.body.password) {
                if(user.isActive == true){
                  isPresent = true;
                  correctPassword = true;
                  isActive = true;
                  loggedInUser = {
                      userName: user.userName,
                      email: user.email,
                      role: user.role,
                      firstName: user.firstName,
                      lastName: user.lastName,
                      password: user.password,
                      isActive: user.isActive,
                      token: user.token
                  }
                }
              }
              else {
                  isPresent = true;
              }
          }
      });
          res.json({ isPresent: isPresent, correctPassword: correctPassword, isActive: isActive, user: loggedInUser });
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

app.post('/api/arduino/update-arduino', (req, res) => {
 
  let arduino = {
    arduinoid: req.body.arduinoid,
    username: req.body.username,
    arduinoname: req.body.arduinoname,
    arduinoapikey: req.body.arduinoapikey,
    arduinotype: req.body.arduinotype,
    arduinoactive: req.body.arduinoactive,
    arduinocommand: req.body.arduinocommand
};
let count = 0;    
let newvalues = { $set: {
  username: arduino.username, 
  arduinoname: arduino.arduinoname,
  arduinoapikey: arduino.arduinoapikey,
  arduinotype: arduino.arduinotype,
  arduinoactive: arduino.arduinoactive,
  arduinocommand: arduino.arduinocommand } };
let query = { _id: ObjectID(arduino.arduinoid)};
arduinos.find({}).toArray((err, Arduino) => {
    if (err) {
        console.log(err);
        return res.status(500).send(err);
    }
   
        arduinos.updateOne(query, newvalues, (err, Arduino) => {
            if(err){
                res.send(err);
            }
            res.json(Arduino);
        });
    
   
});
});


app.post('/api/arduino/get-arduino', (req, res) => {
let arduinoList = [];
let arduinoTypeValue = '';
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

app.post('/api/arduino/type-list', (req, res) => {
  let typeList = [];
  type_lists.find({}).toArray((err, type_lists) => {
    if(err) return res.send(err);
    type_lists.forEach((type) => {
      let _typeList = {
        id:'',
        key:'',
        value:''};
          _typeList.id = type._id.toString();
          _typeList.key = type.key;
          _typeList.value = type.value;
          typeList.push(_typeList);
        
    });
        res.json({ typeList: typeList });
  });
  });

  app.post('/api/arduino/get-user-list', (req, res) => {
    let userList = [];
    users.find({}).toArray((err, users) => {
      if(err) return res.send(err);
      users.forEach((user) => {
        let _userList = {
          id: '',
          userName: '',
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: '',
          token: '',
          isActive: false
      };
          _userList.id = user._id.toString();
          _userList.firstName = user.firstName;
          _userList.lastName = user.lastName;
          _userList.userName = user.userName;
          _userList.email = user.email;
          _userList.password = user.password;
          _userList.role = user.role;
          _userList.token = user.token;
          _userList.isActive = user.isActive;
            userList.push(_userList);
          
      });
          res.json({ userList: userList });
    });
    });

    app.post('/api/arduino/update-user', (req, res) => {
 
      let user = {
        id: req.body.id,
        userName: req.body.userName,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        role: req.body.role,
        token: req.body.token,
        isActive: req.body.isActive
    };
    let count = 0;    
    let newvalues = { $set: {
      username: user.userName, 
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token: user.token,
      isActive: user.isActive } };
    let query = { _id: ObjectID(user.id)};
    users.find({}).toArray((err, User) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
       
            users.updateOne(query, newvalues, (err, User) => {
                if(err){
                    res.send(err);
                }
                res.json(User);
            });
        
       
    });
    });

server = http.Server(app),

send404 = function(res){
  res.writeHead(404);
  res.write('404');
  res.end();
};

server.listen(restApiPort);

console.log('Rest Api Port : ' + restApiPort);



// socket.io, I choose you
// simplest chat application evar
var io = io.listen(server)
  , buffer = [];
  
io.on('connection', function(client){
  client.send({ buffer: buffer });
  client.broadcast.send({ announcement: client.id + ' connected' });
  
  chatGuests.push(client);
  
  client.on('message', function(message){
    var msg = { message: [client.id, message] };
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
    console.log('num of connections on port ' + tcpServerPort + ' : ' + tcpServer.connections);
    tcpServer.getConnections(function(err, count){
      console.log("count", count);
  })
    tcpGuests.push(socket);
    
    socket.on('data',function(data){
        console.log('received on tcp socket:'+data);
        socket.write('msg received\r\n');
        if(!data.toString().search('val')){
          console.log('value :  ' + data.toString());
        }
        else{
          arduinoList.set(data.toString().trim() , socket)
        }
      
        
        for (g in chatGuests) {
          var client = chatGuests[g];
          //client.send({message:["data",data.toString('ascii',0,data.length)]});
          client.emit('message',{
            greeting: data.toString()
        });
          
      }

        //send data to guest socket.io chat server
        for (g in io.clients) {
            var client = io.clients[g];
            client.send({message:["data",data.toString('ascii',0,data.length)]});
            
        }
    })
});
tcpServer.listen(tcpServerPort);
console.log('TCP Port : ' + tcpServerPort);

