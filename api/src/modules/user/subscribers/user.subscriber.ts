import { EntitySubscriberInterface, EventSubscriber } from 'typeorm';
import { User } from '@modules/user/entities/users.entity';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  listenTo() {
    return User;
  }

  async afterUpdate() {
    // event: UpdateEvent<User>
    // const changedFields: (keyof User)[] = [
    //   'firstName',
    //   'lastName',
    //   'avatarUrl',
    //   'password',
    //   'email',
    //   'isActive',
    // ];
    // const logs = changedFields
    //   .filter((field) => event.databaseEntity[field] !== event.entity[field])
    //   .map((field) => {
    //     const log = new ActivityLog();
    //     log.entityName = 'User';
    //     log.entityId = event.entity.id;
    //     log.field = field;
    //     log.oldValue = String(event.databaseEntity[field]);
    //     log.newValue = String(event.entity[field]);
    //     log.updatedBy = event.queryRunner.data?.userId || 'system';
    //     return log;
    //   });
    //
    // if (logs.length) {
    //   await event.manager.getRepository(ActivityLog).save(logs);
    // }
  }
}
