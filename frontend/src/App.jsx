import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Generator from './pages/Generator';
import History from './pages/History';

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Generator />} />
                <Route path="/history" element={<History />} />
            </Routes>
        </Router>
    );
}