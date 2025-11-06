#!/usr/bin/env tsx
/**
 * Script para hacer admin a un usuario por email
 * 
 * Uso:
 *   npm run make-admin -- mcortesteyssier@itba.edu.ar
 *   o
 *   tsx scripts/make-user-admin.ts mcortesteyssier@itba.edu.ar
 */

import 'reflect-metadata';
import AppDataSource from '../src/database/data-source.ts';
import { UserRoles } from '../src/entities/user-roles.entity.ts';
import userService from '../src/services/userService.ts';

const email = process.argv[2] || 'mcortesteyssier@itba.edu.ar';

async function makeUserAdmin() {
  try {
    // Inicializar conexión a la base de datos
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log(`Buscando usuario con email: ${email}`);

    // Buscar usuario por email
    const user = await userService.findByEmail(email);

    if (!user) {
      console.error(`❌ Usuario con email "${email}" no encontrado`);
      process.exit(1);
    }

    console.log(`✅ Usuario encontrado: ${user.firstName} ${user.lastName} (ID: ${user.id})`);

    // Verificar si ya es admin
    const userRolesRepository = AppDataSource.getRepository(UserRoles);
    const existingAdminRole = await userRolesRepository.findOne({
      where: {
        userId: user.id,
        roleId: 'admin',
      },
    });

    if (existingAdminRole) {
      console.log(`ℹ️  El usuario ya tiene el rol admin`);
      process.exit(0);
    }

    // Crear rol admin
    const adminRole = userRolesRepository.create({
      userId: user.id,
      roleId: 'admin',
    });

    await userRolesRepository.save(adminRole);

    console.log(`✅ Rol admin asignado exitosamente a ${email}`);
    console.log(`\nUsuario actualizado:`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Nombre: ${user.firstName} ${user.lastName}`);
    console.log(`  - Habilitado: ${user.enabled ? 'Sí' : 'No'}`);
    console.log(`  - Rol: admin`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al asignar rol admin:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

makeUserAdmin();

