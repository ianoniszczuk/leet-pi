import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Exercise } from './exercise.entity.ts';

@Entity({ name: 'guides' })
export class Guide {
  @PrimaryColumn({ name: 'guide_number', type: 'int' })
  guideNumber!: number;

  @Column({ name: 'enabled', type: 'boolean', default: false })
  enabled!: boolean;

  @OneToMany(() => Exercise, (exercise) => exercise.guide)
  exercises!: Exercise[];
}

export default Guide;
