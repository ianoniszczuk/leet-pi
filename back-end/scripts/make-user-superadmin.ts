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

    // Buscar usuario por email, crearlo si no existe
    let user = await userService.findByEmail(email);

    if (!user) {
      console.log(`⚠️  Usuario no encontrado, creando nuevo usuario con email "${email}"...`);
      const userRepository = AppDataSource.getRepository((await import('../src/entities/user.entity.ts')).default);
      user = userRepository.create({ email, sub: null, fullName: null, enabled: true });
      user = await userRepository.save(user);
      console.log(`✅ Usuario creado (ID: ${user.id})`);
    } else {
      console.log(`✅ Usuario encontrado: ${user.fullName ?? email} (ID: ${user.id})`);
    }

    // Verificar si ya es admin
    const userRolesRepository = AppDataSource.getRepository(UserRoles);
    const existingAdminRole = await userRolesRepository.findOne({
      where: {
        userId: user.id,
        roleId: 'superadmin',
      },
    });

    if (existingAdminRole) {
      console.log(`ℹ️  El usuario ya tiene el rol admin`);
      process.exit(0);
    }

    // Crear rol admin
    const adminRole = userRolesRepository.create({
      userId: user.id,
      roleId: 'superadmin',
    });

    await userRolesRepository.save(adminRole);

    console.log(`✅ Rol SUPERADMIN asignado exitosamente a ${email}`);
    console.log(`\nUsuario actualizado:`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Nombre: ${user.fullName}`);
    console.log(`  - Habilitado: ${user.enabled ? 'Sí' : 'No'}`);
    console.log(`  - Rol: SUPERADMIN`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al asignar rol SUPERADMIN:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

makeUserAdmin();

