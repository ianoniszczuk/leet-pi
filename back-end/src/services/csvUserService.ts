import { parse } from 'csv-parse/sync';
import userService from './userService.ts';
import userDAO from '../persistence/user.dao.ts';
import { User } from '../entities/user.entity.ts';

export interface SyncResult {
  enabledCount: number;
  disabledCount: number;
  createdCount: number;
  errors: string[];
  totalProcessed: number;
}

export class CSVUserService {
  /**
   * Procesa un archivo CSV y sincroniza el estado enabled de los usuarios
   * @param csvContent - Contenido del archivo CSV como string
   * @returns Promise<SyncResult> - Estadísticas del proceso
   */
  async syncUsersFromCSV(csvContent: string): Promise<SyncResult> {
    const result: SyncResult = {
      enabledCount: 0,
      disabledCount: 0,
      createdCount: 0,
      errors: [],
      totalProcessed: 0,
    };

    try {
      // Parsear el CSV
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      if (!Array.isArray(records) || records.length === 0) {
        result.errors.push('El archivo CSV está vacío o no tiene el formato correcto');
        return result;
      }

      // Extraer emails del CSV
      const emailsInCSV = new Set<string>();
      for (const record of records) {
        if (!record.email) {
          result.errors.push(`Fila sin campo email: ${JSON.stringify(record)}`);
          continue;
        }

        const email = record.email.trim().toLowerCase();
        if (!this.isValidEmail(email)) {
          result.errors.push(`Email inválido: ${email}`);
          continue;
        }

        emailsInCSV.add(email);
      }

      result.totalProcessed = emailsInCSV.size;

      // Habilitar usuarios que están en el CSV
      for (const email of emailsInCSV) {
        try {
          let user = await userDAO.findByEmail(email);
          
          if (!user) {
            // Crear usuario si no existe (con enabled = true)
            user = await userDAO.findByEmailOrCreate(email, {
              enabled: true,
            });
            result.createdCount++;
          } else {
            // Actualizar a enabled = true si no lo está
            if (!user.enabled) {
              await userService.updateEnabledStatus(email, true);
            }
          }
          result.enabledCount++;
        } catch (error: any) {
          result.errors.push(`Error procesando email ${email}: ${error.message}`);
        }
      }

      // Deshabilitar usuarios que NO están en el CSV
      // Obtener todos los usuarios habilitados
      const allUsers = await userDAO.findAll();
      const emailsToDisable: string[] = [];

      for (const user of allUsers) {
        if (user.enabled && !emailsInCSV.has(user.email.toLowerCase())) {
          emailsToDisable.push(user.email);
        }
      }

      if (emailsToDisable.length > 0) {
        const disabledCount = await userService.bulkUpdateEnabledStatus(emailsToDisable, false);
        result.disabledCount = disabledCount;
      }

      return result;
    } catch (error: any) {
      result.errors.push(`Error procesando CSV: ${error.message}`);
      return result;
    }
  }

  /**
   * Valida si un email tiene formato válido
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default new CSVUserService();

