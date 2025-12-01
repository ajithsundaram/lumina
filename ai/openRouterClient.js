async function getFetch() {
  const mod = await import('node-fetch');
  return mod.default;
}

const { formatSQL } = require('../utils/sqlFormatter');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'kwaipilot/kat-coder-pro:free'; 

function buildSchemaPrompt(schema) {
  let s = '';

  s += 'You are an expert MySQL query generator.\n';
  s += 'You will be given database schema metadata and a natural language request.\n\n';

  s += 'STRICT RULES:\n';
  s += '- Use ONLY the tables and columns present in the provided schema.\n';
  s += '- Use EXACT enum values from COLUMN_TYPE for conditional filters.\n';
  s += '- Do NOT hallucinate table names, column names, or enum values.\n';
  s += '- Prefer indexed columns for joins and filters whenever possible.\n';
  s += '- Generate the MOST EFFICIENT SQL query possible.\n';
  s += '- If the query cannot be generated using this schema, return exactly: INVALID_QUERY\n';
  s += '- Output ONLY the final raw SQL query.\n';
  s += '- No explanations. No markdown. No comments.\n\n';

  s += 'Database Schema:\n';

  for (const [table, columns] of Object.entries(schema)) {
    s += `Table ${table}:\n`;
    columns.forEach(col => {
      s += `  - ${col.column} (${col.type}, nullable=${col.nullable}, key=${col.key})\n`;
    });
  }

  s += '\nUser Request:\n{{user_input}}\n';

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
