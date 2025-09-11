import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Submission } from './submission.entity.ts';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'sub', type: 'varchar', length: 255, unique: true, nullable: false })
  sub!: string;

  @Column({ name: 'email', type: 'varchar', length: 50, unique: true, nullable: false })
  email!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: false })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: false })
  lastName!: string;

  @OneToMany(() => Submission, (submission) => submission.user)
  submissions!: Submission[];
}

export default User;
