import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

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
  private baseDir = './objects';

  constructor(users: User[], objects: SecurityObject[]) {
    this.users = users;
    this.objects = objects;
    this.initializeFiles();
  }

  private initializeFiles(): void {
    if (!fs.existsSync(this.baseDir)) fs.mkdirSync(this.baseDir);
    this.objects.forEach(obj => {
      const filePath = path.join(this.baseDir, `${obj.name}.txt`);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, `Файл ${obj.name} (уровень: ${SecurityLevel[obj.securityLevel]})\n`);
      }
    });
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

  availableObjects(user: User): number[] {
    return this.objects
      .map((obj, index) => ({ index, obj }))
      .filter(({ obj }) => user.clearanceLevel >= obj.securityLevel)
      .map(({ index }) => index + 1);
  }

  printObjectList(): void {
    console.log('Список объектов:');
    this.objects.forEach((obj, idx) => {
      console.log(`${idx + 1}: ${obj.name} (уровень: ${SecurityLevel[obj.securityLevel]})`);
    });
  }

  async requestAccess(user: User, objectIndex: number, rl: readline.Interface): Promise<void> {
    const index = objectIndex - 1;
    if (index < 0 || index >= this.objects.length) {
      console.log('Объект не найден.');
      return;
    }

    const obj = this.objects[index];
    const filePath = path.join(this.baseDir, `${obj.name}.txt`);

    console.log(`\nФайл ${obj.name}:`);
    let canRead = user.clearanceLevel >= obj.securityLevel;
    let canWrite = user.clearanceLevel <= obj.securityLevel;

    if (canRead) {
      const content = fs.readFileSync(filePath, 'utf-8');
      console.log('Содержимое файла:');
      console.log(content);
    } else {
      console.log('Чтение запрещено. Недостаточно прав.');
    }

    const writePrompt = await askWithRl(rl, 'Хотите записать в файл? (yes/no): ');
    if (writePrompt.toLowerCase() === 'yes') {
      if (canWrite) {
        const newText = await askWithRl(rl, 'Введите текст для записи: ');
        fs.appendFileSync(filePath, `${user.username}: ${newText}\n`);
        console.log('Текст записан.');
      } else {
        console.log('Запись запрещена. Можно писать только в объекты своей категории или более высокой.');
      }
    }
  }
}

function generatePassword(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

function randomLevel(): SecurityLevel {
  const levels = Object.values(SecurityLevel).filter(v => typeof v === 'number') as number[];
  return levels[Math.floor(Math.random() * levels.length)] as SecurityLevel;
}

const usernames = ['Ivan', 'Sergey', 'Boris', 'Yosef', 'Moshe'];
const users: User[] = usernames.map(name => ({
  username: name,
  password: generatePassword(),
  clearanceLevel: randomLevel()
}));

const objects: SecurityObject[] = Array.from({ length: 5 }, (_, i) => ({
  name: `Объект_${i + 1}`,
  securityLevel: randomLevel()
}));

const mac = new MandatoryAccessControl(users, objects);

console.log('Список пользователей и их паролей:');
users.forEach(u => {
  console.log(`${u.username}: ${u.password} (уровень доступа: ${SecurityLevel[u.clearanceLevel]})`);
});
console.log();
mac.printObjectList();
console.log();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function askWithRl(rl: readline.Interface, question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve));
}

async function session() {
  const username = await askWithRl(rl, 'Введите имя пользователя: ');
  const password = await askWithRl(rl, 'Введите пароль: ');
  const user = mac.authenticate(username, password);

  if (!user) return;

  const available = mac.availableObjects(user);
  console.log(`Доступные объекты: ${available.join(', ')}`);

  while (true) {
    const command = await askWithRl(rl, 'Введите номер объекта для доступа или "quit" для выхода: ');
    if (command.toLowerCase() === 'quit') {
      console.log(`Работа пользователя ${user.username} завершена. До свидания.`);
      break;
    }
    const objectIndex = parseInt(command);
    if (isNaN(objectIndex)) {
      console.log('Некорректный ввод. Введите номер объекта.');
      continue;
    }
    await mac.requestAccess(user, objectIndex, rl);
  }
}

async function main() {
  while (true) {
    await session();
  }
}

main();
