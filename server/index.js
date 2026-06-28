const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL
            );
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS scores (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                score INTEGER NOT NULL,
                played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Таблицы PostgreSQL готовы!");
    } catch (err) {
        console.error("Ошибка при создании таблиц:", err);
    }
};
initDB();

// ==========================================

app.post('/api/users', async (req, res) => {
    const { username } = req.body;
    try {
        let user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        
        if (user.rows.length === 0) {
            user = await pool.query(
                'INSERT INTO users (username) VALUES ($1) RETURNING *',
                [username]
            );
        }
        res.json(user.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/scores', async (req, res) => {
    const { user_id, score } = req.body;
    try {
        const newScore = await pool.query(
            'INSERT INTO scores (user_id, score) VALUES ($1, $2) RETURNING *',
            [user_id, score]
        );
        res.json(newScore.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/scores/top', async (req, res) => {
    try {
        const topScores = await pool.query(`
            SELECT users.username, scores.score, scores.played_at 
            FROM scores 
            JOIN users ON scores.user_id = users.id 
            ORDER BY scores.score DESC 
            LIMIT 10;
        `);
        res.json(topScores.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту http://localhost:${PORT}`);
});