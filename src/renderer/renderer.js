const hostInput = document.getElementById('host');
const portInput = document.getElementById('port');
const userInput = document.getElementById('user');
const dbInput = document.getElementById('database');
const passwordInput = document.getElementById('password');
const connectBtn = document.getElementById('connectBtn');
const statusSpan = document.getElementById('status');

const nlInput = document.getElementById('nlInput');
const generateSqlBtn = document.getElementById('generateSqlBtn');
const sqlOutput = document.getElementById('sqlOutput');
const runQueryBtn = document.getElementById('runQueryBtn');
const resultsDiv = document.getElementById('results');

let cachedSchema = null;

connectBtn.addEventListener('click', async () => {
  statusSpan.textContent = 'Connecting...';
  try {
    await window.api.connectDB({
      host: hostInput.value,
      port: Number(portInput.value),
      user: userInput.value,
      password: passwordInput.value,
      database: dbInput.value
    });
    statusSpan.textContent = 'Connected ✅';

    // Fetch schema once after connect
    cachedSchema = await window.api.getSchema();
  } catch (err) {
    console.error(err);
    statusSpan.textContent = 'Error: ' + err.message;
  }
});

generateSqlBtn.addEventListener('click', async () => {
  if (!cachedSchema) {
    alert('Connect to the database first.');
    return;
  }

  const nl = nlInput.value.trim();
  const model = document.getElementById('modelInput').value.trim(); 

  sqlOutput.value = 'Generating SQL...';

  try {
    const sql = await window.api.generateSQL(nl, cachedSchema, model);
    sqlOutput.value = sql;
  } catch (err) {
    sqlOutput.value = 'Error generating SQL: ' + err.message;
  }
});


runQueryBtn.addEventListener('click', async () => {
  const sql = sqlOutput.value.trim();
  if (!sql) return;
  resultsDiv.innerHTML = 'Running...';
  try {
    const rows = await window.api.runQuery(sql);
    renderResults(rows);
  } catch (err) {
    console.error(err);
    resultsDiv.textContent = 'Error: ' + err.message;
  }
});

function renderResults(rows) {
  if (!rows || rows.length === 0) {
    resultsDiv.textContent = 'No rows.';
    return;
  }

  const cols = Object.keys(rows[0]);
  let html = '<table><thead><tr>';
  cols.forEach(col => { html += `<th>${col}</th>`; });
  html += '</tr></thead><tbody>';

  rows.forEach(row => {
    html += '<tr>';
    cols.forEach(col => {
      html += `<td>${row[col]}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';

  resultsDiv.innerHTML = html;
}
