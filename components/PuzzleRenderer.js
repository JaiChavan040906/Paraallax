'use client';

import { useState } from 'react';
import Game1Set1 from '@/components/puzzles/Game1/Game1Set1';
import Game1Set2 from '@/components/puzzles/Game1/Game1Set2';
import Game1Set3 from '@/components/puzzles/Game1/Game1Set3';
import Game2Set1 from '@/components/puzzles/Game2/Game2Set1';
import Game2Set2 from '@/components/puzzles/Game2/Game2Set2';
import Game3Set1 from '@/components/puzzles/Game3/Game3Set1';
import Game3Set2 from '@/components/puzzles/Game3/Game3Set2';
import Game3Set3 from '@/components/puzzles/Game3/Game3Set3';
import Game4Set1 from '@/components/puzzles/Game4/Game4Set1';
import Game4Set2 from '@/components/puzzles/Game4/Game4Set2';
import Game4Set3 from '@/components/puzzles/Game4/Game4Set3';
import Game5Set1 from '@/components/puzzles/Game5/Game5Set1';
import Game5Set2 from '@/components/puzzles/Game5/Game5Set2';
import Game5Set3 from '@/components/puzzles/Game5/Game5Set3';
import Game6Set1 from '@/components/puzzles/Game6/Game6Set1';
import Game6Set2 from '@/components/puzzles/Game6/Game6Set2';
import Game6Set3 from '@/components/puzzles/Game6/Game6Set3';
import Game7Set1 from '@/components/puzzles/Game7/Game7Set1';
import Game7Set2 from '@/components/puzzles/Game7/Game7Set2';
import Game7Set3 from '@/components/puzzles/Game7/Game7Set3';
import Game8Set1 from '@/components/puzzles/Game8/Game8Set1';
import Game9Set1 from '@/components/puzzles/Game9/Game9Set1';



export default function PuzzleRenderer({ puzzle, onSubmit, submitting }) {
    if (!puzzle) return <div className="text-terminal-muted text-sm">No puzzle loaded.</div>;

    const typeStr = String(puzzle.type || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    switch (typeStr) {
        
        case 'game1set1':
        case 'game1-set1':
            return <Game1Set1 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        case 'game1set2':
        case 'game1-set2':
            return <Game1Set2 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        case 'game1set3':
        case 'game1-set3':
            return <Game1Set3 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        case 'game2set1':
        case 'game2-set1':
            return <Game2Set1 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        case 'game2set2':
        case 'game2-set2':
            return <Game2Set2 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;



        case 'game3set1':
        case 'game3-set1':
            return <Game3Set1 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        case 'game3set2':
        case 'game3-set2':
            return <Game3Set2 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        case 'game3set3':
        case 'game3-set3':
            return <Game3Set3 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        case 'game4set1':
        case 'game4-set1':
            return <Game4Set1 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        case 'game4set2':
        case 'game4-set2':
            return <Game4Set2 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        case 'game4set3':
        case 'game4-set3':
            return <Game4Set3 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        case 'game5set1':
        case 'game5-set1':
            return <Game5Set1 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        case 'game5set2':
        case 'game5-set2':
            return <Game5Set2 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        case 'game5set3':
        case 'game5-set3':
            return <Game5Set3 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        case 'game6set1':
        case 'game6-set1':
            return <Game6Set1 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        case 'game6set2':
        case 'game6-set2':
            return <Game6Set2 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        case 'game6set3':
        case 'game6-set3':
            return <Game6Set3 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        case 'game7set1':
        case 'game7-set1':
            return <Game7Set1 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        case 'game7set2':
        case 'game7-set2':
            return <Game7Set2 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        case 'game7set3':
        case 'game7-set3':
            return <Game7Set3 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        case 'game8set1':
        case 'game8-set1':
            return <Game8Set1 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        case 'game9set1':
        case 'game9-set1':
        case 'game9set2':
        case 'game9-set2':
        case 'game9set3':
        case 'game9-set3':
            return <Game9Set1 puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;

        default:
            return <div className="text-terminal-red border border-terminal-red p-4 rounded text-xs">Unknown Error: This sector is missing. Request administrator intervention.</div>;
    }
}
