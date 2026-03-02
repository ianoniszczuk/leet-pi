import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Submission } from './submission.entity.ts';
import { UserRoles } from './user-roles.entity.ts';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'sub', type: 'varchar', length: 255, unique: true, nullable: true })
  sub!: string | null;

  @Column({ name: 'email', type: 'varchar', length: 50, unique: true, nullable: false })
  email!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 200, nullable: true })
  fullName!: string | null;

  @Column({ name: 'enabled', type: 'boolean', default: false })
  enabled!: boolean;

  @OneToMany(() => Submission, (submission) => submission.user)
  submissions!: Submission[];

  @OneToMany(() => UserRoles, (userRole) => userRole.user)
  userRoles!: UserRoles[];
}

export default User;
