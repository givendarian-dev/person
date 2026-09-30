import { SQL } from "bun";

const db = new SQL({
    adapter: "mysql",
    hostname: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    // Allow MySQL RSA public key retrieval
    allowPublicKeyRetrieval: true,
});

export default db;