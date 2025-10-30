import bcrypt from 'bcryptjs';
import { db, runAsync, initializeDatabase } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    initializeDatabase();
    await new Promise(resolve => setTimeout(resolve, 1000));

    const hashedAdminPassword = await bcrypt.hash('Admin123!', 10);
    const hashedFacultyPassword = await bcrypt.hash('Faculty123!', 10);
    const hashedStudentPassword = await bcrypt.hash('Student123!', 10);

    await runAsync(
      'INSERT OR IGNORE INTO users (email, password, role, name) VALUES (?, ?, ?, ?)',
      ['admin@test.com', hashedAdminPassword, 'admin', 'Admin User']
    );

    await runAsync(
      'INSERT OR IGNORE INTO users (email, password, role, name) VALUES (?, ?, ?, ?)',
      ['faculty@test.com', hashedFacultyPassword, 'faculty', 'Dr. Sarah Johnson']
    );

    await runAsync(
      'INSERT OR IGNORE INTO users (email, password, role, name) VALUES (?, ?, ?, ?)',
      ['student@test.com', hashedStudentPassword, 'student', 'John Smith']
    );

    console.log('✓ Test accounts created successfully!');
    console.log('\nTest Credentials:');
    console.log('─────────────────────────────────────');
    console.log('Admin Account:');
    console.log('  Email: admin@test.com');
    console.log('  Password: Admin123!');
    console.log('─────────────────────────────────────');
    console.log('Faculty Account:');
    console.log('  Email: faculty@test.com');
    console.log('  Password: Faculty123!');
    console.log('─────────────────────────────────────');
    console.log('Student Account:');
    console.log('  Email: student@test.com');
    console.log('  Password: Student123!');
    console.log('─────────────────────────────────────');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err.message);
    process.exit(1);
  }
}

seedDatabase();
