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

    // Si existe, actualizar información si es necesario
    const needsUpdate = 
      user.email !== payload.email ||
      user.firstName !== (payload.given_name || payload.name?.split(' ')[0] || '') ||
      user.lastName !== (payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '');

    if (needsUpdate) {
      const updatedUser = await userDAO.update(user.id, {
        email: payload.email,
        firstName: payload.given_name || payload.name?.split(' ')[0] || '',
        lastName: payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '',
      });
      return updatedUser || user;
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
}

export default new UserService();
