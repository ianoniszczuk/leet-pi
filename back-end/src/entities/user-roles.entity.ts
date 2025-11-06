import { Entity, PrimaryColumn } from "typeorm";

@Entity({ name: 'user_roles' })
export class UserRoles {
    @PrimaryColumn({ name: 'user_id', type: 'uuid' })
    userId!: string;

    @PrimaryColumn({ name: 'role_id', type: 'varchar', length: 50 })
    roleId!: string;
}

export default UserRoles;
