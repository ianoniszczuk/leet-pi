import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum EmailType {
  GUIDE_DEADLINE_ALERT = 'GUIDE_DEADLINE_ALERT',
}

@Entity({ name: 'email_schedules' })
export class EmailSchedule {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'email', type: 'varchar', enum: EmailType })
  email!: EmailType;

  @Column({ name: 'date', type: 'date' })
  date!: Date;

  @Column({ name: 'is_sent', type: 'boolean', default: false })
  isSent!: boolean;
}

export default EmailSchedule;
