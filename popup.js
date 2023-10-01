let _TAB;
let _META;
let _LIST = [];

function hideAlert() {
  document.getElementById("alert").style.display = "none";
  document.getElementById("status").innerText = "";
}
function showAlert(status) {
  document.getElementById("alert").style.display = "flex";
  document.getElementById("status").innerText = status;
}

async function getSession(key) {
  const session = await chrome.storage.session.get([key]);
  return session[key];
}

async function setSession(key, value) {
  await chrome.storage.session.set({ [key]: value });
}

async function clearSession() {
  await chrome.storage.session.clear();
}

async function extractMeta() {
  const getData = () => {
    const metas = [...document.getElementsByTagName("meta")];
    return {
      title: document.title,
      image: metas.find((meta) => meta.name === "twitter:image")?.content,
    };
  };
  const result = await chrome.scripting.executeScript({
    target: { tabId: _TAB.id },
    func: getData,
  });
  return result[0].result;
}

async function save() {
  await setSession("mtg_cards", _LIST);
  showList(_LIST);
}

async function remove(index) {
  if (index >= _LIST.length) {
    return;
  }
  _LIST.splice(index, 1);
  await save();
}

async function showList(list = []) {
  const table = document.getElementById("list");
  if (!Array.isArray(list) || list.length === 0) {
    table.innerHTML = "<tr><td>Empty List</td></tr>";
    return;
  }
  table.innerHTML = list.map(
    (item, index) =>
      `<tr><td><a href="${item.url}" target="parent">${item.title}</a></td><td style="text-align:center">${item.qty}</td><td style="text-align:right"><button id="dlt-${index}">X</button></td></tr>`
  );
  for (let i = 0; i < list.length; i++) {
    document
      .getElementById(`dlt-${i}`)
      .addEventListener("click", () => remove(i));
  }
}

async function add() {
  const qty = document.getElementById("qty").value || "1";
  const url = _TAB.url;
  const title = _META.title;
  const image = _META.image;
  const index = _LIST.findIndex((card) => card.url === url);
  console.log(index);
  if (index < 0) {
    _LIST.push({ url, qty, title, image });
  } else {
    _LIST[index].qty = parseInt(_LIST[index].qty || 0) + parseInt(qty);
  }
  await save();
}

async function copy() {
  const el = document.createElement("textarea");
  el.value = _LIST.map((row) => [row.url, row.qty].join("\t")).join("\n");
  el.setAttribute("readonly", "");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

async function init(disabled) {
  _LIST = (await getSession("mtg_cards")) || [];
  showList(_LIST);
  document.getElementById("cpy-xls").addEventListener("click", copy);

  if (!disabled) {
    _META = await extractMeta();
    document.getElementById("card-title").innerText = _META.title;
    document.getElementById("add-btn").addEventListener("click", add);
  }
}

chrome.tabs.query(
  {
    active: true,
    lastFocusedWindow: true,
  },
  function (tabs) {
    const tab = tabs[0];
    if (!tab) {
      showAlert("Cannot get current tab");
      return;
    }

    let disabled = false;
    if (!tab.url?.includes("https://www.cardkingdom.com/mtg/")) {
      showAlert(
        "You must be in https://www.cardkingdom.com/mtg/ to add cards to your list"
      );
      document.getElementById("form").style.display = "none";
      disabled = true;
    } else {
      _TAB = tab;
      hideAlert();
    }
    init(disabled);
  }
);
