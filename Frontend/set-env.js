const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'environments', 'environment.ts');

// Si existe la variable de entorno API_URL (inyectada por Vercel), actualizamos environment.ts
if (process.env.API_URL) {
  const envConfigFile = `export const environment = {
  apiUrl: '${process.env.API_URL}',
};
`;
  fs.writeFileSync(targetPath, envConfigFile, { encoding: 'utf8' });
  console.log(`[Vercel Build] environment.ts actualizado exitosamente con apiUrl: ${process.env.API_URL}`);
} else {
  console.log('[Vercel Build] No se detectó la variable API_URL en el entorno. Se mantendrá la configuración local en environment.ts.');
}
