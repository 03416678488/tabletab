const { execSync } = require('child_process');

// Read the migration name from command-line args
const migrationName = process.argv[2];

if (!migrationName) {
  console.error(
    '❌ Please provide a migration name! Example: npm run create-migration user/create-user-table',
  );
  process.exit(1);
}

// Define the base folder for all migrations
const baseFolder = 'src/database/migrations';

// Build the full path
const fullPath = `${baseFolder}/${migrationName}`;

console.log(`🚀 Creating migration at: ${fullPath}`);

// Call TypeORM CLI to create migration
execSync(`ts-node ./node_modules/typeorm/cli.js migration:create ${fullPath}`, {
  stdio: 'inherit',
});
