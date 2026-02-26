import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity.ts';
import { UserRoles } from '../entities/user-roles.entity.ts';

interface AdminRow {
    email: string;
    firstName: string;
    lastName: string;
}

const DEFAULT_CSV_PATH = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    '../../scripts/data/admins.csv',
);

/**
 * Siembra los administradores iniciales desde un CSV.
 * Requiere que AppDataSource ya esté inicializado.
 *
 * Para cada fila del CSV:
 *   - Crea el usuario si no existe (enabled=true, sub=null)
 *   - Habilita al usuario si estaba deshabilitado
 *   - Asigna el rol "admin" si no lo tenía
 *
 * Es idempotente: puede llamarse múltiples veces sin efectos secundarios.
 *
 * @param dataSource - DataSource de TypeORM ya inicializado
 * @param csvPath    - Ruta opcional al CSV (por defecto: scripts/data/admins.csv)
 */
export async function seedAdmins(
    dataSource: DataSource,
    csvPath: string = DEFAULT_CSV_PATH,
): Promise<void> {
    if (!fs.existsSync(csvPath)) {
        console.warn(`⚠️  [Seed] Archivo de admins no encontrado: ${csvPath}`);
        console.warn('   El servidor continuará sin sembrar administradores.');
        return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    let rows: AdminRow[];

    try {
        rows = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        }) as AdminRow[];
    } catch (err: any) {
        console.error(`❌ [Seed] Error al parsear el CSV de admins: ${err.message}`);
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validRows = rows
        .filter((row) => {
            if (!row.email || !emailRegex.test(row.email.trim())) {
                console.warn(`⚠️  [Seed] Email inválido ignorado: ${row.email}`);
                return false;
            }
            return true;
        })
        .map((row) => ({
            email: row.email.trim().toLowerCase(),
            firstName: (row.firstName ?? '').trim(),
            lastName: (row.lastName ?? '').trim(),
        }));

    if (validRows.length === 0) {
        console.warn('⚠️  [Seed] No hay filas válidas en el CSV de admins.');
        return;
    }

    const userRepo = dataSource.getRepository(User);
    const userRolesRepo = dataSource.getRepository(UserRoles);

    let created = 0;
    let enabled = 0;
    let rolesAssigned = 0;

    for (const row of validRows) {
        try {
            let user = await userRepo.findOne({ where: { email: row.email } });

            if (!user) {
                user = await userRepo.save(
                    userRepo.create({
                        email: row.email,
                        firstName: row.firstName,
                        lastName: row.lastName,
                        sub: null,
                        enabled: true,
                    }),
                );
                created++;
            } else if (!user.enabled) {
                if (row.firstName && !user.firstName) user.firstName = row.firstName;
                if (row.lastName && !user.lastName) user.lastName = row.lastName;
                user.enabled = true;
                await userRepo.save(user);
                enabled++;
            }

            const existingRole = await userRolesRepo.findOne({
                where: { userId: user.id, roleId: 'superadmin' },
            });

            if (!existingRole) {
                await userRolesRepo.save(
                    userRolesRepo.create({ userId: user.id, roleId: 'superadmin' }),
                );
                rolesAssigned++;
            }
        } catch (err: any) {
            console.error(`❌ [Seed] Error procesando ${row.email}: ${err.message}`);
        }
    }

    if (created || enabled || rolesAssigned) {
        console.log(
            `✅ [Seed] Admins → creados: ${created}, habilitados: ${enabled}, roles asignados: ${rolesAssigned}`,
        );
    } else {
        console.log('✅ [Seed] Admins ya estaban correctamente configurados.');
    }
}
