async function getFetch() {
  const mod = await import('node-fetch');
  return mod.default;
}

const { formatSQL } = require('../utils/sqlFormatter');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'kwaipilot/kat-coder-pro:free'; 

function buildSchemaPrompt(schema) {
  let s = 'You are an assistant that converts natural language to MySQL SQL queries.\n';
  s += 'Database schema:\n';

  for (const [table, columns] of Object.entries(schema)) {
    s += `Table ${table}:\n`;
    columns.forEach(col => {
      s += `  - ${col.column} (${col.type})\n`;
    });
  }

  s += '\n use exact enum values from the provided schema meta for conditional matching, Return ONLY the full SQL query. No explanations, no markdown.\n';
  return s;
}

async function generateSQLFromText(naturalLanguage, schema, model) {
  const prompt = buildSchemaPrompt(schema);
  const apitoken = process.env.OPENROUTER_API_KEY;

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apitoken}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'localhost',
      'X-Title': 'LUMINA DB'
    },
    body: JSON.stringify({
      model: model || MODEL,
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: `User request: "${naturalLanguage}". Generate a single valid MySQL query.`
        }
      ],
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter error: ${errText}`);
  }

  const data = await response.json();
  var sql = data.choices?.[0]?.message?.content?.trim() || '';
  // In case it returns backticks or "SQL:" prefix, strip them:
  sql = sql.replace(/```sql|```/g, "").trim();
  const formatted = await formatSQL(sql);
  return sql
}

module.exports = { generateSQLFromText };
