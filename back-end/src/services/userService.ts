import { User } from '../entities/user.entity.ts';
import type { Auth0Payload } from '../middleware/auth.ts';
import userDAO from '../persistence/user.dao.ts';

export class UserService {
  constructor() {
    // El DAO se inicializa automáticamente
  }

  /**
   * Busca un usuario por su Auth0 subject ID
   */
  async findBySub(sub: string): Promise<User | null> {
    return await userDAO.findBySub(sub);
  }

  /**
   * Busca un usuario por su email
   */
  async findByEmail(email: string): Promise<User | null> {
    return await userDAO.findByEmail(email);
  }

  /**
   * Crea un nuevo usuario desde los datos de Auth0
   */
  async createFromAuth0(payload: Auth0Payload): Promise<User> {
    const userData = {
      sub: payload.sub,
      email: payload.email,
      firstName: payload.given_name || payload.name?.split(' ')[0] || '',
      lastName: payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '',
      enabled: false, // Por defecto, los nuevos usuarios no están habilitados
    };

    return await userDAO.create(userData);
  }

  /**
   * Sincroniza o crea un usuario desde Auth0
   * Si el usuario existe, lo actualiza con la información más reciente
   */
  async syncFromAuth0(payload: Auth0Payload): Promise<User> {
    let user = await this.findBySub(payload.sub);

    if (!user) {
      // Si no existe, crear nuevo usuario
      return await this.createFromAuth0(payload);
    }

    return user;
  }

  /**
   * Obtiene un usuario por ID
   */
  async findById(id: string): Promise<User | null> {
    return await userDAO.findById(id);
  }

  /**
   * Obtiene todos los usuarios (para administración)
   */
  async findAll(): Promise<User[]> {
    return await userDAO.findAll();
  }

  /**
   * Elimina un usuario por ID
   */
  async deleteById(id: string): Promise<boolean> {
    return await userDAO.deleteById(id);
  }

  /**
   * Busca usuarios por nombre
   */
  async searchByName(searchTerm: string): Promise<User[]> {
    return await userDAO.searchByName(searchTerm);
  }

  /**
   * Obtiene usuarios con paginación
   */
  async findWithPagination(page: number = 1, limit: number = 10): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return await userDAO.findWithPagination(page, limit);
  }

  /**
   * Obtiene estadísticas de usuarios
   */
  async getStats(): Promise<{
    totalUsers: number;
    usersWithSubmissions: number;
  }> {
    return await userDAO.getStats();
  }

  /**
   * Obtiene los usuarios con más submissions
   */
  async findTopSubmitters(limit: number = 10): Promise<User[]> {
    return await userDAO.findTopSubmitters(limit);
  }

  /**
   * Verifica si existe un usuario con el email dado
   */
  async existsByEmail(email: string): Promise<boolean> {
    return await userDAO.existsByEmail(email);
  }

  /**
   * Verifica si existe un usuario con el sub dado
   */
  async existsBySub(sub: string): Promise<boolean> {
    return await userDAO.existsBySub(sub);
  }

  /**
   * Sincroniza o crea un usuario desde Auth0 con verificación de enabled
   * Si el usuario no está habilitado, lanza un error
   */
  async syncFromAuth0WithEnabledCheck(payload: Auth0Payload): Promise<User | null> {
    let user = await this.findBySub(payload.sub);

    if (!user) {
      // Si no existe por sub, buscar por email (podría ser un usuario creado desde CSV)
      user = await this.findByEmail(payload.email);

      if (user) {
        // Usuario existe pero sin sub (creado desde CSV), solo vincular el sub de Auth0
        const updatedUser = await userDAO.update(user.id, { sub: payload.sub });
        user = updatedUser || user;
      } else {
        return null;
      }
    }

    // Verificar si el usuario está habilitado
    if (!user.enabled) {
      const error: any = new Error('Usuario no habilitado para acceder a la plataforma');
      error.statusCode = 403;
      throw error;
    }

    return user;
  }

  /**
   * Actualiza el firstName y lastName del usuario identificado por sub
   */
  async updateProfile(sub: string, data: { firstName: string; lastName: string }): Promise<User | null> {
    const user = await userDAO.findBySub(sub);
    if (!user) return null;
    return await userDAO.update(user.id, data);
  }

  /**
   * Actualiza el estado enabled de un usuario por email
   */
  async updateEnabledStatus(email: string, enabled: boolean): Promise<User | null> {
    return await userDAO.updateEnabledByEmail(email, enabled);
  }

  /**
   * Actualiza el estado enabled de múltiples usuarios
   */
  async bulkUpdateEnabledStatus(emails: string[], enabled: boolean): Promise<number> {
    return await userDAO.bulkUpdateEnabled(emails, enabled);
  }
}

export default new UserService();
