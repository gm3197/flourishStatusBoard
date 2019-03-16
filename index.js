var ws = require("nodejs-websocket")
var fs = require("fs")
var http = require("http"),
    url = require("url"),
    path = require("path")

var connections = [] // an array of websocket connections
var boardData;

/*
 * Load information from JSON files
 */
fs.readFile("data/boardData.json", 'utf8', function(err, data) {
  if (err) throw err;
  boardData = JSON.parse(data)
})

/*
 * Functions for saving data to JSON files
 */

function saveBoardData() {
  fs.writeFile("data/boardData.json", JSON.stringify(boardData), function(err) {
    if (err) throw err;
  })
  sendDataToAllConnections({
    "job": "updateBoardDisplay",
    "data": boardData
  })
}

/*
 * Create http server and configure handler function. Then listen on port 80
 */
http.createServer(function(req, res) {
  var uri = url.parse(req.url).pathname
  switch (uri) {
    case "/":
      res.writeHead(200)
      res.end(fs.readFileSync('./static/index.html'))
      break;
    case "/index.js":
      res.writeHead(200)
      res.end(fs.readFileSync('./static/index.js'))
      break;
    case "/main.css":
      res.writeHead(200)
      res.end(fs.readFileSync('./static/main.css'))
      break;
    case "/sky.css":
      res.writeHead(200)
      res.end(fs.readFileSync('./static/sky.css'))
      break;
    default:
      res.writeHead(308, {"Location": "/"})
      res.end()
  }
}).on("error", function(err) {
  console.log("HTTP Server threw an error: " + err)
}).listen(80)

/*
 * Create websocket server and configure handler function. Then listen on port 8000
 */
ws.createServer(function(connection) {
  connection.on("text", function(str) {
    try {
      var data = JSON.parse(str)
      if (data.job == "subscribe") {
        connections.push(connection)
        sendDataToConnection(connection, {
          "job": "updateBoardDisplay",
          "data": boardData
        })
      } else if (data.job == "createBoardEntry") {
        createBoardEntry(data)
      } else if (data.job == "removeBoardEntry") {
        removeBoardEntry(data)
      } else if (data.job == "updateBoardEntry") {
        updateBoardEntry(data)
      } else if (data.job == "updateBoardFields") {
        updateBoardFields(data)
      }
    } catch(err) {
      sendDataToConnection(connection, {"error":"invalid request"})
    }
  })

  connection.on("close", function() {
    for (var i = 0; i < connections.length; i++) {
      if (connection == connections[i]) {
        connections.splice(i,1)
        break
      }
    }
  })

  connection.on("error", function(err) {
    // oop
  })
}).listen(8000)


/*
 * Websocket helper functions
 */
function sendDataToAllConnections(data) {
  for (var i = 0; i < connections.length; i++) {
    sendDataToConnection(connections[i], data)
  }
}

function sendDataToConnection(connection, data) {
  connection.sendText(JSON.stringify(data))
}

function createBoardEntry(data) {
  let entry = data.data
  entry.id = Math.floor(Math.random() * 10000000)
  boardData.entries.push(entry)
  saveBoardData()
}

function removeBoardEntry(data) {
  for (var i = 0; i < boardData.entries.length; i++) {
    if (data.data.id == boardData.entries[i].id) {
      boardData.entries.splice(i, 1)
      break
    }
  }
  saveBoardData()
}

function updateBoardEntry(data) {
  for (var i = 0; i < boardData.entries.length; i++) {
    if (boardData.entries[i].id == data.data.id) {
      boardData.entries[i] = data.data
      break
    }
  }
  saveBoardData()
}

function updateBoardFields(data) {
  boardData.fields = data.data.fields
  saveBoardData()
}
