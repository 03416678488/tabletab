const { execSync } = require('child_process');

try {
  console.log('🚀 Running pending migrations...');
  // Map Migrations to Build folder
  execSync('npm run build', { stdio: 'inherit' });
  // Tell TypeORM where the DataSource file is
  execSync(
    'npm run typeorm migration:run -- -d src/config/migration.config.ts',
    {
      stdio: 'inherit',
    },
  );

  console.log('✅ Migrations executed successfully!');
} catch (error) {
  console.error('❌ Failed to run migrations:', error);
  process.exit(1);
}
