import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'app_settings' })
export class AppSetting {
  @PrimaryColumn({ name: 'key', type: 'varchar' })
  key!: string;

  @Column({ name: 'value', type: 'text', nullable: true })
  value!: string | null;
}

export default AppSetting;
