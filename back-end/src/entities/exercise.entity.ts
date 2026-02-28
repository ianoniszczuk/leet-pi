import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { Guide } from './guide.entity.ts';
import { Submission } from './submission.entity.ts';

@Entity({ name: 'exercises' })
export class Exercise {
  @PrimaryColumn({ name: 'guide_number', type: 'int' })
  guideNumber!: number;

  @PrimaryColumn({ name: 'exercise_number', type: 'int' })
  exerciseNumber!: number;

  @Column({ name: 'enabled', type: 'boolean', default: false })
  enabled!: boolean;

  @Column({ name: 'function_signature', type: 'text', nullable: false, default: null })
  functionSignature!: string | null;

  @ManyToOne(() => Guide, (guide) => guide.exercises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guide_number', referencedColumnName: 'guideNumber' })
  guide!: Guide;

  @OneToMany(() => Submission, (submission) => submission.exercise)
  submissions!: Submission[];
}

export default Exercise;
