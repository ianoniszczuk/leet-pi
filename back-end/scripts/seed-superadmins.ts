#!/usr/bin/env tsx
/**
 * Script CLI para sembrar administradores iniciales manualmente.
 *
 * En condiciones normales NO hace falta correr este script a mano:
 *   el servidor lo ejecuta automáticamente al arrancar (npm run dev / Docker).
 *
 * Usarlo cuando se quiera forzar el seed sin levantar el servidor, por ejemplo
 * para inicializar una BD nueva antes del primer deploy.
 *
 * Uso:
 *   npm run seed-admins                              # usa scripts/data/admins.csv
 *   npm run seed-admins -- --file /ruta/admins.csv   # CSV alternativo
 *   tsx scripts/seed-admins.ts
 */

import 'reflect-metadata';
import path from 'path';
import AppDataSource from '../src/database/data-source.ts';
import { seedAdmins } from '../src/database/seed.ts';

const fileArgIndex = process.argv.indexOf('--file');
const customPath = process.argv[fileArgIndex + 1];
const csvPath = fileArgIndex !== -1 && customPath
    ? path.resolve(customPath)
    : undefined; // undefined → seed.ts usará el path por defecto

async function main() {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║         Seed de Administradores          ║');
    console.log('╚══════════════════════════════════════════╝\n');

    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        console.log('🔗 Conectado a la base de datos.\n');
    } catch (err: any) {
        console.error(`❌ No se pudo conectar a la BD: ${err.message}`);
        console.error('   Asegurate de que la base de datos esté corriendo.');
        process.exit(1);
    }

    await seedAdmins(AppDataSource, csvPath);

    await AppDataSource.destroy();
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Error inesperado:', err);
    process.exit(1);
});
