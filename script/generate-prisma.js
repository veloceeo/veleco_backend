const { exec } = require('child_process');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'db', 'prisma', 'schema.prisma');

exec(`npx prisma generate --schema=${schemaPath}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
  console.log(`Prisma generate completed: ${stdout}`);
});