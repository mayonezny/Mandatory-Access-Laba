import * as readline from 'readline';

enum SecurityLevel {
  OPEN = 1,
  SECRET,
  TOP_SECRET,
}

interface User {
  username: string;
  password: string;
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

  authenticate(username: string, password: string): User | null {
    const user = this.users.find(u => u.username === username && u.password === password);
    if (user) {
      console.log(`Идентификация прошла успешно, добро пожаловать в систему, ${username}`);
    } else {
      console.log('Ошибка идентификации. Неверное имя пользователя или пароль.');
    }
    return user || null;
  }

  availableObjects(user: User): string[] {
    return this.objects.filter(obj => user.clearanceLevel >= obj.securityLevel).map(o => o.name);
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

function generatePassword(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

const users: User[] = [
  { username: 'Ivan', password: generatePassword(), clearanceLevel: SecurityLevel.TOP_SECRET },
  { username: 'Sergey', password: generatePassword(), clearanceLevel: SecurityLevel.SECRET },
  { username: 'Boris', password: generatePassword(), clearanceLevel: SecurityLevel.OPEN },
  { username: 'Yosef', password: generatePassword(), clearanceLevel: SecurityLevel.SECRET },
  { username: 'Moshe', password: generatePassword(), clearanceLevel: SecurityLevel.OPEN },
];

const objects: SecurityObject[] = [
  { name: 'Объект_1', securityLevel: SecurityLevel.OPEN },
  { name: 'Объект_2', securityLevel: SecurityLevel.SECRET },
  { name: 'Объект_3', securityLevel: SecurityLevel.TOP_SECRET },
  { name: 'Объект_4', securityLevel: SecurityLevel.OPEN },
  { name: 'Объект_5', securityLevel: SecurityLevel.SECRET },
];

const mac = new MandatoryAccessControl(users, objects);

console.log('Список пользователей и их паролей:');
users.forEach(u => console.log(`${u.username}: ${u.password}`));

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  const username = await ask('Введите имя пользователя: ');
  const password = await ask('Введите пароль: ');
  const user = mac.authenticate(username, password);

  if (!user) {
    rl.close();
    return;
  }

  const available = mac.availableObjects(user);
  console.log(`Доступные объекты: ${available.join(', ')}`);

  while (true) {
    const command = await ask('Введите имя объекта для доступа или "quit" для выхода: ');
    if (command.toLowerCase() === 'quit') {
      console.log(`Работа пользователя ${user.username} завершена. До свидания.`);
      break;
    }
    mac.requestAccess(user, command);
  }
  rl.close();
}

main();
