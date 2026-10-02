import db from "./src/config/database";
import { createProfile, deleteProfile, getProfileById, getProfiles, updateProfile } from "./src/controllers/profile";
import index from './frontend/index.html';


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
    port: PORT,
    routes: {
        // frontend routes
        "/": index,

        // Backend routes
        "/api/server": () => Response.json({ message: "Server is running" }),
        "/api/profile": {
            POST: createProfile,
            GET: (req) => {
                const url = new URL(req.url);
                // If ?id= is present in the URL, fetch by ID; otherwise fetch all
                if (url.searchParams.has("id")) {
                    return getProfileById(req);
                }
                return getProfiles(req);
            },
            DELETE : deleteProfile,
            PUT : updateProfile
        },
    },
    fetch(req) { return new Response("Not Found", { status: 404 }) }

});

console.log(`Server is running on port ${PORT}!`);

