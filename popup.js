const _FILE_ID = "ADD YOU GOOGLE SHEET ID";
let _TAB;
let _TOKEN;

function setStatus(status) {
  document.getElementById("status").innerText = status;
}

async function extractTitle() {
  const getData = () => {
    const metas = [...document.getElementsByTagName("meta")];
    const availability = metas.find(
      (meta) => meta.property === "product:availability"
    )?.content;
    return [document.title];
  };
  const result = await chrome.scripting.executeScript({
    target: { tabId: _TAB.id },
    func: getData,
  });
  return result[0].result[0];
}

async function getNumRows(sheet) {
  const headers = {
    Authorization: `Bearer ${_TOKEN}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${_FILE_ID}/values/${sheet}`,
    {
      method: "GET",
      headers,
    }
  );
  const data = await response.json();
  if (!data.values) {
    return 0;
  }
  return data.values.length;
}

async function appendToSheet() {
  const sheet = document.getElementById("sheet").value;
  const title = await extractTitle();
  const rows = await getNumRows(sheet);
  const headers = {
    Authorization: `Bearer ${_TOKEN}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${_FILE_ID}/values/${sheet}!A:A:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        majorDimension: "ROWS",
        values: [
          [
            _TAB.url,
            title,
            `=IMPORTXML(A${rows + 1}; "//span[@class='styleQty']")`,
            `=TRANSPOSE(IMPORTXML(A${
              rows + 1
            }; "//meta[@property='product:availability']/@content | //input[@name='price']/@value"))`,
          ],
        ],
      }),
    }
  )
    .then((res) => {
      setStatus("done");
    })
    .catch((error) => setStatus(error.message));
}

function createSubmitButton() {
  const submitButton = document.createElement("button");
  submitButton.innerText = "Add";
  submitButton.onclick = function () {
    setStatus("Adding row, please wait");
    appendToSheet();
  };
  return submitButton;
}

async function main() {
  const contentDiv = document.getElementById("content");

  const sheetInput = document.createElement("input");
  sheetInput.type = "text";
  sheetInput.id = "sheet";
  contentDiv.appendChild(sheetInput);

  const submitButton = createSubmitButton();
  contentDiv.appendChild(submitButton);
  setStatus("Add current card to your sheet");
}

function authenticate() {
  setStatus("Authenticating with Google Drive");
  chrome.identity.getAuthToken({ interactive: true }, function (token) {
    if (token === undefined) {
      setStatus("Error authenticating with Google Drive");
      console.log("Error authenticating with Google Drive");
    } else {
      _TOKEN = token;
      main();
    }
  });
}

chrome.tabs.query(
  {
    active: true,
    lastFocusedWindow: true,
  },
  function (tabs) {
    const tab = tabs[0];
    if (!tab) {
      setStatus("Cannot get current tab");
      return;
    }
    if (!tab.url?.includes("https://www.cardkingdom.com/mtg/")) {
      setStatus("You must be in https://www.cardkingdom.com/mtg/");
      return;
    }
    _TAB = tab;
    authenticate();
  }
);
