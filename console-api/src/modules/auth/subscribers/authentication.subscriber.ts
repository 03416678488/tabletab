import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import { AuthenticationProvider } from '@modules/auth/providers/authentication.provider';
import { User } from '@modules/user/entities/users.entity';

@EventSubscriber()
export class AuthenticationSubscriber implements EntitySubscriberInterface<User> {
  listenTo() {
    return User;
  }

  async beforeInsert({ entity }: InsertEvent<User>): Promise<void> {
    if (entity.password) {
      entity.password = await AuthenticationProvider.generateHash(entity.password);
    }

    if (entity.email) {
      entity.email = entity.email.toLowerCase();
    }
  }

  async beforeUpdate({ entity, databaseEntity }: UpdateEvent<User>): Promise<void> {
    if (entity.password) {
      const password = await AuthenticationProvider.generateHash(entity.password);

      if (password !== databaseEntity?.password) {
        entity.password = password;
      }
    }
  }

  afterInsert() {
    // console.log(
    //   '✅ AuthenticationSubscriber triggered: User inserted',
    //   event.entity,
    // );
  }
}
