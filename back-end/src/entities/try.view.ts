import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  name: 'tries',
  expression: (dataSource) =>
    dataSource
      .createQueryBuilder()
      .select('s.user_id', 'user_id')
      .addSelect('s.guide_number', 'guide_number')
      .addSelect('s.exercise_number', 'exercise_number')
      .addSelect('bool_or(s.success)', 'success')
      .from('submissions', 's')
      .groupBy('s.user_id')
      .addGroupBy('s.guide_number')
      .addGroupBy('s.exercise_number'),
})
export class Try {
  @ViewColumn({ name: 'user_id' })
  userId!: string;

  @ViewColumn({ name: 'guide_number' })
  guideNumber!: number;

  @ViewColumn({ name: 'exercise_number' })
  exerciseNumber!: number;

  @ViewColumn({ name: 'success' })
  success!: boolean;
}

export default Try;
