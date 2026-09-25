const PORT = 5500;

const server = Bun.serve({
    port : PORT,
    routes : {
        "/" : () => new Response('Welcome to the Personal Profile System')
    },
    
});

console.log(`Server is running on port ${PORT}!`);

