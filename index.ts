import db from "./src/config/database";

try {
    const result = await db`
        SELECT 1 AS connected
    `;

    console.log("✅ MySQL connected successfully");
    // console.log(result);
} catch (error) {
    console.error("❌ MySQL connection failed");
    console.error(error);
}
const PORT = 5500;

const server = Bun.serve({
    port : PORT,
    routes : {
        // front edn routed
        "/" : () => new Response('Welcome to the Personal Profile System'),

        // Backend routes
        "/api/server" : () => Response.json({message : "Server is running"})
    },
    fetch(req) {return new Response("Not Found", {status : 404})}
    
});

console.log(`Server is running on port ${PORT}!`);

