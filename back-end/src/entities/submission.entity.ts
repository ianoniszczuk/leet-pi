import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type SubmissionStatus = 'pending' | 'approved' | 'failed' | 'compilation_error';

// @TODO: eliminar esta entidad, es un ejemplo de prueba para probar comandos de TypeORM

@Entity({ name: 'submissions' })
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  exerciseNumber!: number;

  @Column({ type: 'text' })
  code!: string;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status!: SubmissionStatus;

  @Column({ type: 'jsonb', nullable: true })
  resultSummary!: any | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

export default Submission;

