// scripts/seedPuzzles.js
// Run: node scripts/seedPuzzles.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const games = [
    { id: 1, sets: 3, title: 'Power Grid' },
    { id: 2, sets: 2, title: 'Handshake Protocol' },
    { id: 3, sets: 3, title: 'Database Schema' },
    { id: 4, sets: 3, title: 'The Firewall' },
    { id: 5, sets: 3, title: 'OS Deadlock' },
    { id: 6, sets: 3, title: 'Dynamic Cipher Grid' },
    { id: 7, sets: 3, title: 'Memory Access System' },
    { id: 8, sets: 1, title: 'H.I.P.S. Interceptor' }
];

const puzzles = [];
games.forEach(game => {
    for (let setIdx = 1; setIdx <= game.sets; setIdx++) {
        puzzles.push({
            puzzleId: `game${game.id}set${setIdx}`,
            type: `game${game.id}set${setIdx}`,
            title: `${game.title} - Set ${setIdx}`,
            prompt: `Interactive module: ${game.title} (Set ${setIdx})`,
            uiConfig: {},
            answer: 'Solved',
            penaltySecondsOnWrong: 300,
        });
    }
});

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set in .env.local');

    mongoose.connection.on('error', (err) => {
        console.warn('Mongoose background connection error:', err.message);
    });

    for (let i = 0; i < 10; i++) {
        try {
            await mongoose.connect(uri, { tlsAllowInvalidCertificates: true, serverSelectionTimeoutMS: 5000, family: 4 });

            const PuzzleSchema = new mongoose.Schema({
                puzzleId: { type: String, unique: true, required: true },
                type: { type: String, required: true },
                title: { type: String, required: true },
                prompt: { type: String, required: true },
                uiConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
                answer: { type: mongoose.Schema.Types.Mixed, required: true },
                penaltySecondsOnWrong: { type: Number, default: 300 },
            });
            const Puzzle = mongoose.models.Puzzle || mongoose.model('Puzzle', PuzzleSchema);

            // Clear old generic P-01 type puzzles
            await Puzzle.deleteMany({});
            console.log('✓ Cleared old puzzles from the database.');

            const ops = puzzles.map((p) => ({
                updateOne: {
                    filter: { puzzleId: p.puzzleId },
                    update: { $set: p },
                    upsert: true,
                },
            }));

            await Puzzle.bulkWrite(ops);
            console.log(`✓ Seeded ${puzzles.length} REAL interactive game modules into the flat pool!`);
            await mongoose.disconnect();
            return; // Exit on success
        } catch (e) {
            console.warn(`Attempt ${i + 1} failed: ${e.message}, retrying in 2s...`);
            await mongoose.disconnect().catch(() => { });
            await new Promise(res => setTimeout(res, 2000));
        }
    }
    throw new Error('Failed to seed Puzzles after 10 attempts');
}

main().catch((err) => { console.error(err); process.exit(1); });
