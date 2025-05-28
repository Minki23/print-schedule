import bcrypt from 'bcryptjs';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });
const saltRounds = 10;

async function main() {
  console.log('--- Password Hashing Utility ---');
  try {
    const password = await rl.question('Enter the password to hash: ');

    if (!password) {
      console.error('Password cannot be empty.');
      process.exit(1);
    }

    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Hashed Password:', hash);
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error; // Re-throw to be caught by the caller of main()
  } finally {
    rl.close();
  }
}

main()
  .catch((err) => {
    console.error('Script execution failed:', err);
    process.exit(1);
  });