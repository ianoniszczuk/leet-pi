import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { Exercise } from './exercise.entity.ts';
import { EmailSchedule } from './email-schedule.entity.ts';

@Entity({ name: 'guides' })
export class Guide {
  @PrimaryColumn({ name: 'guide_number', type: 'int' })
  guideNumber!: number;

  @Column({ name: 'enabled', type: 'boolean', default: false })
  enabled!: boolean;

  @Column({ name: 'deadline', type: 'timestamp', nullable: true, default: () => 'NULL' })
  deadline!: Date | null;

  @Column({ name: 'pending_email_schedule_id', type: 'uuid', nullable: true, default: () => 'NULL' })
  pendingEmailScheduleId!: string | null;

  @ManyToOne(() => EmailSchedule, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'pending_email_schedule_id' })
  pendingEmailSchedule!: EmailSchedule | null;

  @OneToMany(() => Exercise, (exercise) => exercise.guide)
  exercises!: Exercise[];
}

export default Guide;
