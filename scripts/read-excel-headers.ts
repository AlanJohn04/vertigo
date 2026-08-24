import fs from 'fs';
import path from 'path';

// Let's inspect the files in "Diagnosis of peripheral vertigo"
const files = fs.readdirSync('Diagnosis of peripheral vertigo');
console.log("Excel files:", files);
