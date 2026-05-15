const fs = require('fs');

if (process.argv.length < 3) {
  console.log('Usage: node encode-key.js <path-to-json-file>');
  process.exit(1);
}

const filePath = process.argv[2];

try {
  const jsonContent = fs.readFileSync(filePath, 'utf8');
  // Validate it's JSON
  JSON.parse(jsonContent);
  
  const base64Str = Buffer.from(jsonContent).toString('base64');
  console.log('\n✅ Successfully encoded JSON key!');
  console.log('\nCopy the following string and paste it into backend/.env as VERTEX_SERVICE_ACCOUNT_JSON:\n');
  console.log(base64Str);
  console.log('\n');
} catch (e) {
  console.error('❌ Error reading or parsing JSON file:', e.message);
}
