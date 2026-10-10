const { mkdirSync, copyFileSync } = require('node:fs');
const { join } = require('node:path');
const directory = join(__dirname, '..', 'dist', 'database', 'migrations');
mkdirSync(directory, { recursive: true });
copyFileSync(join(__dirname, '..', 'src', 'database', 'migrations', 'initial-schema.sql'), join(directory, 'initial-schema.sql'));
