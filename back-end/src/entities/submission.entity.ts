import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity.ts';
import { Exercise } from './exercise.entity.ts';

@Entity({ name: 'submissions' })
export class Submission {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @PrimaryColumn({ name: 'guide_number', type: 'int' })
  guideNumber!: number;

  @PrimaryColumn({ name: 'exercise_number', type: 'int' })
  exerciseNumber!: number;

  @PrimaryColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @Column({ name: 'code', type: 'text' })
  code!: string;

  @Column({ name: 'success', type: 'boolean' })
  success!: boolean;

  @ManyToOne(() => User, (user) => user.submissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user!: User;

  @ManyToOne(() => Exercise, (exercise) => exercise.submissions, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'guide_number', referencedColumnName: 'guideNumber' },
    { name: 'exercise_number', referencedColumnName: 'exerciseNumber' },
  ])
  exercise!: Exercise;
}

export default Submission;
