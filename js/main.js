const BOT_NAME = "AI BOT";
const PERSON_NAME = "You";
const XLSX_FILENAME = "example.xlsx";
const ROW_LIMIT = 25;
const msgerForm = get(".msger-inputarea");
const msgerInput = get(".msger-input");
const msgerChat = get(".msger-chat");
let responseNum = 0;
let responseNew = true;
let socket = new WebSocket("ws://localhost:3001");

socket.onopen = function (e) {
  console.log("[open] Connection established");
};

socket.onmessage = function (event) {
  console.log(`[message] Data received from server: ${event.data}`);
  let response = event.data;
  try { document.querySelector(".waiting").remove(); } catch (e) { }
  if (response == "<EndOfStream>") {
    responseNew = true;
    responseNum += 1;
  } else {
    if (responseNew) {
      startResponse(BOT_NAME, response);
      responseNew = false;
    } else {
      streamResponse(response);
    }
  }
};

function streamResponse(chunk) {
  currentResponse = document.querySelector("#response-" + responseNum).innerHTML;
  document.querySelector("#response-" + responseNum).innerHTML = currentResponse + chunk;
  msgerChat.scrollTop += 500;
}

socket.onclose = function (event) {
  if (event.wasClean) {
    console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
  } else {
    console.log('[close] Connection died');
  }
};

socket.onerror = function (error) {
  console.log(`[error]`);
};

msgerForm.addEventListener("submit", event => {
  event.preventDefault();

  const msgText = msgerInput.value;
  if (!msgText) return;

  let jsonMsg = { "message": msgText, "model": "sonnet-3", "bucket_name": "csv-query-bucket", "file_name": "Copy of Surgery Partners Location Data.xlsx" }
  socket.send(JSON.stringify(jsonMsg));

  createRequest(PERSON_NAME, msgText);
  msgerInput.value = "";

  appendWaiting(BOT_NAME);
  //console.log(jsonMsg);
  //botResponse();
});

function createRequest(name, text) {
  //   Simple solution for small apps
  const msgHTML = `
    <div class="msg right-msg">
      <div class="msg-img">
        <i class="fas fa-user"></i>
      </div>

      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name}</div>
          <div class="msg-info-time">${formatDate(new Date())}</div>
        </div>

        <div class="msg-text">${text}</div>
      </div>
    </div>
  `;

  msgerChat.insertAdjacentHTML("beforeend", msgHTML);
  msgerChat.scrollTop += 500;
}

function startResponse(name, text) {
  const msgHTML = `
    <div class="msg left-msg">
      <div class="msg-img">
        <i class="fas fa-robot"></i>
      </div>

      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name}</div>
          <div class="msg-info-time">${formatDate(new Date())}</div>
        </div>

        <div class="msg-text" id="response-${responseNum}">${text}</div>
      </div>
    </div>
  `;

  msgerChat.insertAdjacentHTML("beforeend", msgHTML);
  msgerChat.scrollTop += 500;
}


function appendWaiting(name) {
  //   Simple solution for small apps

  const msgWaiting = `
    <div class="msg left-msg waiting">
      <div class="msg-img">
        <i class="fas fa-robot"></i>
      </div>

      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name}</div>
        </div>

        <div class="msg-text">
          <div class="loader-container">
            <div class="loader">
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>        
        </div>
      </div>
    </div>
  `;

  msgerChat.insertAdjacentHTML("beforeend", msgWaiting);
  msgerChat.scrollTop += 500;
}

// Utils
function get(selector, root = document) {
  return root.querySelector(selector);
}

function formatDate(date) {
  return date.toLocaleTimeString();
}

var xhr = new XMLHttpRequest();
xhr.open("GET", XLSX_FILENAME, true);
xhr.overrideMimeType('text\/plain; charset=x-user-defined');
xhr.onload = function (e) {
  var data = xhr.responseText;
  // dummyObject
  var f = new File([], "sample.xlsx", { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  var reader = new FileReader();
  reader.onload = function (e) {
    var workbook;
    workbook = XLSX.read(data, { type: 'binary' });
    // do something

    workbook.SheetNames.forEach(function (sheetName) {
      // Here is your object
      //var header = XLSX.utils.sheet_add_aoa(workbook.Sheets[sheetName], Heading, { origin: 'A1' });
      var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName], {
        header: 1,
        blankrows: false
      });
      var row = 0;
      var table = document.getElementById("preview").getElementsByTagName('tbody')[0];
      var maxcolumns = 0;
      XL_row_object.forEach(function (rowData) {
        if (row < ROW_LIMIT) {
          columns = Object.keys(rowData).length;
          if(columns > maxcolumns) { maxcolumns = columns; }
          //console.log(rowData);
          //console.log(columns);
          if (row == 0) {
            var headerdata = "<tr>";
            for (const [key, value] of Object.entries(rowData)) {
              headerdata += `<th scope="col">${value}</th>`;
            }
            headerdata += "</tr>";
            document.querySelector("#tbheader").innerHTML = headerdata;
            //console.log(headerdata);
          } else {
            var newRow = table.insertRow();
            var c = 0;
            for (const [key, value] of Object.entries(rowData)) {
              //console.log(c + " " + key);
              if(c != key) { lastKey(c, key, newRow); c = key;}
              var cell = newRow.insertCell(key);
              cell.innerHTML = value;
              c++;
            }
            if(c != maxcolumns) { lastKey(c, maxcolumns, newRow);}
          }
        }
        row++;
      })
      //var json_object = JSON.stringify(XL_row_object);
      //console.log(JSON.parse(json_object));
    })
  };
  reader.readAsBinaryString(f);
};
xhr.send(null);

function lastKey(last, current, row){
  for (let i = last; i < current; i++) {
    var cell = row.insertCell(i);
    cell.innerHTML = "";
  }
}