const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function check() {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri, { tlsAllowInvalidCertificates: true, family: 4 });
    const Puzzle = mongoose.models.Puzzle || mongoose.model('Puzzle', new mongoose.Schema({ type: String, puzzleId: String }));
    const puzzles = await Puzzle.find({}).lean();
    
    const domains = {};
    puzzles.forEach(p => {
        const typeStr = String(p.type || p.puzzleId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const match = typeStr.match(/^(game\d+)/);
        const domain = match ? match[1] : typeStr;
        if (!domains[domain]) domains[domain] = [];
        domains[domain].push(p.puzzleId);
    });
    
    console.log('Total Puzzles:', puzzles.length);
    console.log('Domains found:', Object.keys(domains));
    process.exit(0);
}

check();
