const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'busappdb',
    connectionLimit: 5
});

async function query(sql, params) {
    let conn;
    try{
        conn = await pool.getConnection();
        const rows = await conn.query(sql, params);
        return rows;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

module.exports = {query};