import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";

const PORT = 8000; // 設定伺服器監聽的埠號
console.log(`Server is running on http://localhost:${PORT}`);

Deno.serve({ port: PORT }, async (req) => {
  try {
    return await serveDir(req, { fsRoot: "./public" });
  } catch (error) {
    console.error("Error serving file:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
