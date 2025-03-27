enum SecurityLevel {
    OPEN = 1,
    SECRET,
    TOP_SECRET,
  }
  
  interface User {
    username: string;
    clearanceLevel: SecurityLevel;
  }
  
  interface SecurityObject {
    name: string;
    securityLevel: SecurityLevel;
  }
  
  class MandatoryAccessControl {
    private users: User[];
    private objects: SecurityObject[];
  
    constructor(users: User[], objects: SecurityObject[]) {
      this.users = users;
      this.objects = objects;
    }
  
    authenticate(username: string): User | null {
      const user = this.users.find(u => u.username === username);
      if (user) {
        console.log(`Идентификация прошла успешно, добро пожаловать в систему, ${username}`);
      } else {
        console.log('Ошибка идентификации. Пользователь не найден.');
      }
      return user || null;
    }
  
    availableObjects(user: User): void {
      console.log('Перечень доступных объектов:');
      this.objects.forEach(obj => {
        if (user.clearanceLevel >= obj.securityLevel) {
          console.log(`- ${obj.name}`);
        }
      });
    }
  
    requestAccess(user: User, objectName: string): void {
      const obj = this.objects.find(o => o.name === objectName);
      if (!obj) {
        console.log('Объект не найден.');
        return;
      }
      if (user.clearanceLevel >= obj.securityLevel) {
        console.log('Операция прошла успешно.');
      } else {
        console.log('Отказ в выполнении операции. Недостаточно прав.');
      }
    }
  }
  
  // Пример использования:
  const users: User[] = [
    { username: 'Ivan', clearanceLevel: SecurityLevel.TOP_SECRET },
    { username: 'Sergey', clearanceLevel: SecurityLevel.SECRET },
    { username: 'Boris', clearanceLevel: SecurityLevel.OPEN },
  ];
  
  const objects: SecurityObject[] = [
    { name: 'Объект_1', securityLevel: SecurityLevel.OPEN },
    { name: 'Объект_2', securityLevel: SecurityLevel.SECRET },
    { name: 'Объект_3', securityLevel: SecurityLevel.TOP_SECRET },
    { name: 'Объект_4', securityLevel: SecurityLevel.OPEN },
  ];
  
  const mac = new MandatoryAccessControl(users, objects);
  
  const user = mac.authenticate('Boris');
  if (user) {
    mac.availableObjects(user);
    mac.requestAccess(user, 'Объект_1');
    mac.requestAccess(user, 'Объект_2');
  }
  