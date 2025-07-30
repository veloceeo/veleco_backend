import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function build() {
  try {
    console.log('🔄 Generating Prisma client...');
    const schemaPath = path.join(__dirname, '..', 'db', 'prisma', 'schema.prisma');
    await execAsync(`npx prisma generate --schema=${schemaPath}`);
    
    console.log('✅ Prisma client generated successfully');
    
    console.log('🔄 Compiling TypeScript...');
    await execAsync('npx tsc');
    
    console.log('✅ TypeScript compilation completed');
    console.log('🎉 Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();