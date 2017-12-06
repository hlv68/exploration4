//Hanyu Liang
//14197367
//hlv68
//12/4/2017
//Description:In this project, there are multiple clients connecting to the server at the same time. 
//The server can support MAXCLIENTS number of concurrent clients. For the grading purpose, set MAXCLIENTS = 3. 
//The following commands need to be implemented at the client side and the server side implements the corresponding 
//functions required to support these commands. When the server starts, it should first read the user account 
//information from a file. For grading purpose, the initial user accounts (UserID, Password) are (Tom, Tom11), 
//(David, David22), (Beth, Beth33), and (John, John44).
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var _ = require('underscore');

var users = [{
    username: 'Tom',
    password: 'Tom11',
    socketid: '',
    online: false,
  },
  {
    username: 'David',
    password: 'David22',
    socketid: '',
    online: false
  },
  {
    username: 'Beth',
    password: 'Beth33',
    socketid: '',

    online: false
  },
  {
    username: 'John',
    password: 'John44',
    socketid: '',
    online: false
  }
]

var rooms = [{
  name: 'Room1'
}]

server.listen(7367);

app.all('*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By", ' 3.2.1')
  if (req.method == "OPTIONS") res.send(200);
  else next();
});

server.listen(7367);
console.log('My chat room server. Version Two');

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.on('connection', function (socket) {

  // console.log(socket.client.id);

  socket.on('login', function (data) {
    var auth = false;
    for (var i = 0; i < users.length; i++) {
      if (users[i].username == data.username && users[i].password == data.password) {
        auth = true;
        users[i].online = true;
        users[i].socketid = socket.id;
        break;
      }
    }
    if (auth) {
      console.log(data.username + " login");
      socket.broadcast.to("Room1").emit('message', {
        data: data,
        text: data.username + " login"
      })
      socket.emit('message', {
        type: 'loginResult',
        data: data,
        text: "login confirmed"
      })
    } else {
      socket.emit('message', {
        type: 'loginResult',
        data: undefined,
        text: "Incorrect username or password."
      })
    }
  })

  socket.on('who', function () {
    console.log('who');
    var onLineUsers = users.filter(d => {
      if (d.online == true) {
        return d;
      }
    });
    var msg = "";
    for (var i = 0; i < onLineUsers.length; i++) {
      msg += onLineUsers[i].username + ",";
    }
    socket.emit('message', {
      text: msg
    });
  })
  socket.on('newuser', function (d) {
    console.log('newuser ' + d.username + ' ' + d.password);
    d.online = false;
    d.socketid = '';
    users.push(d);
    socket.emit('message', {
      type: 'newuser',
      data: d,
      text: "newuser successfully"
    })
  })
  socket.on('logout', function (data) {
    for (var i = 0; i < users.length; i++) {
      if (users[i].username == data.username && users[i].password == data.password) {
        users[i].online = false;
        break;
      }
    }
    console.log(data.username + " logout");
    socket.broadcast.to("Room1").emit('message', {
      text: data.username + " logout"
    })
    socket.emit('message', {
      type: 'logoutResult',
      text: data.username + " logout"
    })
  })
  //create room
  socket.join(rooms[0].name);

  //receive message and send message
  socket.on('message', function (message) {
    console.log(message.text)
    if (message.type == "toRoom") {
      socket.broadcast.to(message.room).emit('message', {
        text: message.text
      });
    } else if (message.type = "toUser") {
      var toUser = users.filter((u) => {
        if (u.username == message.username) {
          return u;
        }
      })
      if (toUser.length > 0) {
        var toSocket = _.findWhere(io.sockets.sockets, {
          id: toUser[0].socketid
        })
        toSocket.emit('message', {
          text: message.text
        });
        socket.emit('message', {
          text: message.text
        });
      } else {
        socket.emit('message', {
          text: "not find " + message.username
        })
      }
    }

  });

  //listen rooms
  socket.on('rooms', function () {
    socket.emit('rooms', rooms);
  });

  socket.emit('rooms', rooms);

});