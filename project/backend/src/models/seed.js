const Employer = require('./Employer');

const seedEmployers = [
  {
    companyName: 'Kaspi Bank',
    email: 'hr@kaspi.kz',
    description: 'Kazakhstan\'s leading fintech company. Hiring backend, frontend, and mobile engineers. Entry-level and mid-level positions available.'
  },
  {
    companyName: 'Kolesa Group',
    email: 'jobs@kolesa.kz',
    description: 'Kazakhstan\'s largest auto marketplace. Open roles for full-stack developers, data analysts, and QA engineers.'
  },
  {
    companyName: 'Beeline Kazakhstan',
    email: 'career@beeline.kz',
    description: 'Telecom leader with openings in network engineering, IT infrastructure, and software development.'
  },
  {
    companyName: 'EPAM Systems Kazakhstan',
    email: 'recruit@epam.kz',
    description: 'Global software engineering company with offices in Almaty. Entry-level and senior positions across all tech stacks.'
  },
  {
    companyName: 'Jusan Bank',
    email: 'hr@jusan.kz',
    description: 'Digital bank building next-gen banking platform. Hiring iOS, Android, and backend developers.'
  }
];

async function seedDatabase() {
  try {
    const count = await Employer.countDocuments();
    if (count === 0) {
      await Employer.insertMany(seedEmployers);
      console.log('✅ Seeded 5 employers into MongoDB');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

module.exports = seedDatabase;
