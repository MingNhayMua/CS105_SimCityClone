import { pickRandom } from './utils.js';

const firstNames = [
    'James', 'Mary', 'John', 'Patricia', 'Robert',
    'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
    'David', 'Barbara', 'Richard', 'Susan', 'Joseph',
    'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen',
    'Daniel', 'Lisa', 'Matthew', 'Nancy', 'Anthony',
    'Betty', 'Mark', 'Margaret', 'Donald', 'Sandra',
    'Steven', 'Ashley', 'Paul', 'Dorothy', 'Andrew',
    'Kimberly', 'Joshua', 'Emily', 'Kenneth', 'Donna',
    'Kevin', 'Michelle', 'Brian', 'Carol', 'George',
    'Amanda', 'Timothy', 'Melissa', 'Ronald', 'Deborah'
];

const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
    'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris',
    'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
    'Walker', 'Young', 'Allen', 'King', 'Wright',
    'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall',
    'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
];

function generateName() {
    return `${pickRandom(firstNames)} ${pickRandom(lastNames)}`;
}

export function createCitizen(house) {
    return {
        name: generateName(),
        age: 1 + Math.floor(Math.random() * 100),
        state: 'unemployed',
        job: null,
        jobName: null,
        home: house,
        toHTML() {
            const jobInfo = this.job ? this.jobName : 'Unemployed';
            return `<span>${this.name}, ${this.age} — ${jobInfo}</span>`;
        }
    };
}