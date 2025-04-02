import { serve } from "https://deno.land/std@0.202.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.202.0/http/file_server.ts";
import { contentType } from "https://deno.land/std@0.202.0/media_types/mod.ts";

const port = 8000;

async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    
    // 處理靜態文件
    if (url.pathname === "/" || url.pathname === "/index.html") {
        const html = await Deno.readTextFile("./index.html");
        return new Response(html, {
            headers: {
                "content-type": "text/html; charset=utf-8",
            },
        });
    }

    // 處理其他靜態文件
    return await serveDir(req, {
        fsRoot: ".",
        urlRoot: "",
        showDirListing: true,
        enableCors: true,
    });
}

console.log(`HTTP server running on http://localhost:${port}`);
await serve(handler, { port }); 