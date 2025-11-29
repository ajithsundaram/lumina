async function formatSQL(sql) {
  const mod = await import('sql-formatter');

  const { format } = mod;  

  return format(sql, {
    language: "mysql",
    keywordCase: "upper",
    tabWidth: 2,
    linesBetweenQueries: 2
  });
}

module.exports = { formatSQL };
