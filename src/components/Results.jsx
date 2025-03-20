import React from 'react';
import '../styles/Results.css';

const Results = ({ results, resetSimulation }) => {
    const calculateAccuracy = () => {
        const total = results.correctCount + results.incorrectCount;
        return total > 0 ? ((results.correctCount  /total) * 100).toFixed(1) : 0;
    };
}