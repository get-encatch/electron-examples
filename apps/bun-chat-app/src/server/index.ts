import { startServer } from "./createServer"

const server = startServer(process.env.PORT ? Number(process.env.PORT) : 4600)

console.log(`Encatch Bun chat app running at ${server.url}`)
