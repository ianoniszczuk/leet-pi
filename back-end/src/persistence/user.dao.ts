import { Repository } from 'typeorm';
import AppDataSource from '../database/data-source.ts';
import { User } from '../entities/user.entity.ts';

/**
 * Data Access Object para la entidad User
 * Proporciona métodos específicos para operaciones de base de datos relacionadas con usuarios
 */
export class UserDAO {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  /**
   * Busca un usuario por su Auth0 subject ID
   * @param sub - Auth0 subject ID
   * @returns Promise<User | null>
   */
  async findBySub(sub: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { sub },
      relations: ['userRoles'],
    });
  }

  /**
   * Busca un usuario por su email
   * @param email - Email del usuario
   * @returns Promise<User | null>
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { email },
    });
  }

  /**
   * Busca un usuario por su ID
   * @param id - UUID del usuario
   * @returns Promise<User | null>
   */
  async findById(id: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['submissions', 'userRoles'],
    });
  }

  /**
   * Obtiene todos los usuarios con sus submissions
   * @returns Promise<User[]>
   */
  async findAll(): Promise<User[]> {
    return await this.repository.find({
      relations: ['submissions', 'userRoles'],
      order: { firstName: 'ASC', lastName: 'ASC' },
    });
  }

  /**
   * Obtiene usuarios con paginación
   * @param page - Número de página (empezando en 1)
   * @param limit - Cantidad de usuarios por página
   * @returns Promise<{ users: User[], total: number, page: number, totalPages: number }>
   */
  async findWithPagination(page: number = 1, limit: number = 10): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const [users, total] = await this.repository.findAndCount({
      relations: ['submissions', 'userRoles'],
      order: { firstName: 'ASC', lastName: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Crea un nuevo usuario
   * @param userData - Datos del usuario a crear
   * @returns Promise<User>
   */
  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return await this.repository.save(user);
  }

  /**
   * Actualiza un usuario existente
   * @param id - UUID del usuario
   * @param userData - Datos a actualizar
   * @returns Promise<User | null>
   */
  async update(id: string, userData: Partial<User>): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }

    Object.assign(user, userData);
    return await this.repository.save(user);
  }

  /**
   * Elimina un usuario por su ID
   * @param id - UUID del usuario
   * @returns Promise<boolean> - true si se eliminó, false si no se encontró
   */
  async deleteById(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Verifica si existe un usuario con el email dado
   * @param email - Email a verificar
   * @returns Promise<boolean>
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { email },
    });
    return count > 0;
  }

  /**
   * Verifica si existe un usuario con el sub dado
   * @param sub - Auth0 subject ID a verificar
   * @returns Promise<boolean>
   */
  async existsBySub(sub: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { sub },
    });
    return count > 0;
  }

  /**
   * Busca usuarios por nombre (firstName o lastName)
   * @param searchTerm - Término de búsqueda
   * @returns Promise<User[]>
   */
  async searchByName(searchTerm: string): Promise<User[]> {
    return await this.repository
      .createQueryBuilder('user')
      .where(
        'LOWER(user.firstName) LIKE LOWER(:searchTerm) OR LOWER(user.lastName) LIKE LOWER(:searchTerm)',
        { searchTerm: `%${searchTerm}%` }
      )
      .orderBy('user.firstName', 'ASC')
      .addOrderBy('user.lastName', 'ASC')
      .getMany();
  }

  /**
   * Obtiene estadísticas de usuarios
   * @returns Promise<{ totalUsers: number, usersWithSubmissions: number }>
   */
  async getStats(): Promise<{
    totalUsers: number;
    usersWithSubmissions: number;
  }> {
    const totalUsers = await this.repository.count();
    
    const usersWithSubmissions = await this.repository
      .createQueryBuilder('user')
      .leftJoin('user.submissions', 'submission')
      .where('submission.userId IS NOT NULL')
      .getCount();

    return {
      totalUsers,
      usersWithSubmissions,
    };
  }

  /**
   * Obtiene usuarios ordenados por cantidad de submissions
   * @param limit - Cantidad máxima de usuarios a retornar
   * @returns Promise<User[]>
   */
  async findTopSubmitters(limit: number = 10): Promise<User[]> {
    return await this.repository
      .createQueryBuilder('user')
      .leftJoin('user.submissions', 'submission')
      .addSelect('COUNT(submission.userId)', 'submissionCount')
      .groupBy('user.id')
      .orderBy('submissionCount', 'DESC')
      .addOrderBy('user.firstName', 'ASC')
      .limit(limit)
      .getMany();
  }

  /**
   * Actualiza el estado enabled de un usuario por email
   * @param email - Email del usuario
   * @param enabled - Estado enabled a establecer
   * @returns Promise<User | null>
   */
  async updateEnabledByEmail(email: string, enabled: boolean): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }
    user.enabled = enabled;
    return await this.repository.save(user);
  }

  /**
   * Busca un usuario por email o lo crea si no existe
   * @param email - Email del usuario
   * @param defaults - Valores por defecto para crear el usuario
   * @returns Promise<User>
   */
  async findByEmailOrCreate(email: string, defaults: Partial<User>): Promise<User> {
    let user = await this.findByEmail(email);
    if (!user) {
      const userData: Partial<User> = {
        email: email.toLowerCase().trim(),
        ...defaults,
      };
      // sub puede ser null para usuarios creados desde CSV (se actualizará en el primer login)
      if (!userData.sub) {
        userData.sub = null;
      }
      // Si no se proporcionan nombres, usar valores por defecto
      if (!userData.firstName) {
        userData.firstName = '';
      }
      if (!userData.lastName) {
        userData.lastName = '';
      }
      user = await this.create(userData);
    }
    return user;
  }

  /**
   * Actualiza el estado enabled de múltiples usuarios por email
   * @param emails - Array de emails
   * @param enabled - Estado enabled a establecer
   * @returns Promise<number> - Número de usuarios actualizados
   */
  async bulkUpdateEnabled(emails: string[], enabled: boolean): Promise<number> {
    if (emails.length === 0) {
      return 0;
    }
    const result = await this.repository
      .createQueryBuilder()
      .update(User)
      .set({ enabled })
      .where('email IN (:...emails)', { emails: emails.map(e => e.toLowerCase().trim()) })
      .execute();
    return result.affected || 0;
  }
}

// Instancia singleton del DAO
export default new UserDAO();
