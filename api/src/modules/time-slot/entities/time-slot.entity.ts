import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Ordering/service availability window for a weekday. A day may have many. */
@Entity('time_slots')
export class TimeSlot {
  @PrimaryGeneratedColumn()
  id: number;

  /** monday | tuesday | … | sunday */
  @Column({ type: 'varchar' })
  day: string;

  /** HH:mm (24h) */
  @Column({ type: 'varchar' })
  startTime: string;

  /** HH:mm (24h) */
  @Column({ type: 'varchar' })
  endTime: string;
}
