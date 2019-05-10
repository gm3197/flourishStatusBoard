var ws = new WebSocket("ws://" + window.location.host + ":8000");

var lastReceivedBoardData = {}

ws.onopen = function() {
  sendDataToServer({
    "job": "subscribe"
  })
  if (getQueryStrings().hideButtons) {
    document.getElementById('addButton').remove()
  }
};

ws.onmessage = function(evt) {
  var received_msg = evt.data;
  var json_data = JSON.parse(received_msg)
  if (json_data.job == "updateBoardDisplay") {
    lastReceivedBoardData = json_data.data
    setTableData(json_data.data)
  } else {
    if (json_data.error) {
      showError(json_data.error)
    }
  }
};

ws.onclose = function() {
  // websocket is closed.
  showError("The connection to the server has failed. Try reloading the page.");
};

function sendDataToServer(data) {
  ws.send(JSON.stringify(data));
}

function setTableData(data) {
  let headers = "<tr>"
  for (var i = 0; i < data.fields.length; i++) {
    if (!getQueryStrings().hideButtons) {
      headers += `<th style="cursor:pointer;" onclick="showFieldEdit('${data.fields[i].name}')">${data.fields[i].displayName}</th>`
    } else {
      headers += `<th>${data.fields[i].displayName}</th>`
    }
  }
  if (!getQueryStrings().hideButtons) {
    headers += `<th><button class="sky-button-big" onclick="showFieldAdd()">New Column</button></th></tr>`
  }

  let rows = ""
  for (var i = 0; i < data.entries.length; i++) {
    if (!getQueryStrings().hideButtons) {
      rows += `<tr style="cursor:pointer;" onclick="showEdit('${data.entries[i].id}')">`
    } else {
      rows += `<tr>`
    }
    for (var j = 0; j < data.fields.length; j++) {
      rows += `<td>${data.entries[i][data.fields[j].name] || ""}</td>`
    }
    rows += "</tr>"
  }

  document.getElementById('entryTable').innerHTML = headers + rows
}

function showError(text) {
  document.getElementById('showErrors').innerHTML = "<div class=\"sky-alert-message red\">" + text + "</div><br>" + document.getElementById('showErrors').innerHTML
}

function showFieldAdd() {
  showPopup(`<h1>Add Column</h1><label for="newFieldName">Name</label><input id="newFieldName"><br><button class="sky-button-big" onclick="addField()">Add</button><button class="sky-button-big" onclick="hidePopup()">Cancel</button>`)
}

function addField() {
  hidePopup()
  lastReceivedBoardData.fields.push({
    "displayName": document.getElementById('newFieldName').value,
    "name": document.getElementById('newFieldName').value.toLowerCase().replace(/ /g, "")
  })
  sendDataToServer({
    "job": "updateBoardFields",
    "data": lastReceivedBoardData
  })
}

function showFieldEdit(name) {
  for (var i = 0; i < lastReceivedBoardData.fields.length; i++) {
    if (lastReceivedBoardData.fields[i].name == name) {
      showPopup(`<h1>Edit Column</h1><label for="editFieldName">Name</label><input value="${lastReceivedBoardData.fields[i].displayName}" id="editFieldName"><br><button class="sky-button-big" onclick="editField('${lastReceivedBoardData.fields[i].name}')">Save</button><button class="sky-button-big" onclick="hidePopup()">Cancel</button><button class="sky-button-big right" onclick="promptFieldDelete('${lastReceivedBoardData.fields[i].name}')">Delete</button>`)
      break
    }
  }
}

function editField(name) {
  hidePopup()
  for (var i = 0; i < lastReceivedBoardData.fields.length; i++) {
    if (lastReceivedBoardData.fields[i].name == name) {
      lastReceivedBoardData.fields[i].displayName = document.getElementById('editFieldName').value
      break
    }
  }
  sendDataToServer({
    "job": "updateBoardFields",
    "data": lastReceivedBoardData
  })
}

function promptFieldDelete(name) {
  for (var i = 0; i < lastReceivedBoardData.fields.length; i++) {
    if (lastReceivedBoardData.fields[i].name == name) {
      showPopup(`<h1>Delete Column</h1><button class="sky-button-big" onclick="deleteField('${name}')">Delete</button><button class="sky-button-big" onclick="hidePopup()">Cancel</button>`)
      break
    }
  }
}

function deleteField(name) {
  hidePopup()
  for (var i = 0; i < lastReceivedBoardData.fields.length; i++) {
    if (lastReceivedBoardData.fields[i].name == name) {
      lastReceivedBoardData.fields.splice(i, 1)
      break
    }
  }
  sendDataToServer({
    "job": "updateBoardFields",
    "data": lastReceivedBoardData
  })
}

function showAdd() {
  let html = "<h1>Add Entry</h1>"
  for (var i = 0; i < lastReceivedBoardData.fields.length; i++) {
    html += `<label for="newEntryField_${lastReceivedBoardData.fields[i].name}">${lastReceivedBoardData.fields[i].displayName}</label><input type="text" id="newEntryField_${lastReceivedBoardData.fields[i].name}"><br>`
  }
  html += `<button class="sky-button-big" onclick="addEntry()">Add</button><button class="sky-button-big" onclick="hidePopup()">Cancel</button>`
  showPopup(html)
}

function addEntry() {
  hidePopup()
  let data = {}
  for (var i = 0; i < lastReceivedBoardData.fields.length; i++) {
    data[lastReceivedBoardData.fields[i].name] = document.getElementById(`newEntryField_${lastReceivedBoardData.fields[i].name}`).value
  }
  sendDataToServer({
    "job": "createBoardEntry",
    "data": data
  })
}

function showEdit(id) {
  for (var i = 0; i < lastReceivedBoardData.entries.length; i++) {
    console.log()
    if (lastReceivedBoardData.entries[i].id == id) {
      let html = "<h1>Edit Entry</h1>"
      for (var j = 0; j < lastReceivedBoardData.fields.length; j++) {
        html += `<label for="editEntryField_${lastReceivedBoardData.fields[j].name}">${lastReceivedBoardData.fields[j].displayName}</label><input type="text" value="${lastReceivedBoardData.entries[i][lastReceivedBoardData.fields[j].name] || ""}" id="editEntryField_${lastReceivedBoardData.fields[j].name}"><br>`
      }
      html += `<button class="sky-button-big" onclick="editEntry('${id}')">Save</button><button class="sky-button-big" onclick="hidePopup()">Cancel</button><button class="sky-button-big right" onclick="promptDelete('${id}')">Delete</button>`
      showPopup(html)
      break
    }
  }
}

function editEntry(id) {
  hidePopup()
  let data = {}
  for (var i = 0; i < lastReceivedBoardData.fields.length; i++) {
    data[lastReceivedBoardData.fields[i].name] = document.getElementById(`editEntryField_${lastReceivedBoardData.fields[i].name}`).value
  }
  data.id = id
  sendDataToServer({
    "job": "updateBoardEntry",
    "data": data
  })
}

function promptDelete(id) {
  showPopup(`<h1>Delete Entry</h1><button class="sky-button-big" onclick="deleteEntry('${id}')">Delete</button><button class="sky-button-big" onclick="hidePopup()">Cancel</button>`)
}

function deleteEntry(id) {
  hidePopup()
  sendDataToServer({
    "job": "removeBoardEntry",
    "data": {
      "id": id
    }
  })
}

function showPopup(html) {
  document.getElementById('popup').innerHTML = html
  document.getElementById('overlay').style = "visibility:visible;"
}

function hidePopup() {
  document.getElementById('overlay').style = "visibility:hidden;"
}

function getQueryStrings() {
  let dict = {}
  for (var i = 0; i < window.location.search.substring(1).split("&").length; i++) {
    dict[window.location.search.substring(1).split("&")[i]] = true
  }
  return dict;
}
