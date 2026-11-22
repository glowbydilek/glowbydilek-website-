/**
 * Minimal local SMTP sink for end-to-end tests (CI only, never production).
 * Accepts every message (AUTH is accepted without checking) and writes it
 * as an .eml file into MAIL_DIR, so tests can read reset links and check
 * which emails were sent. No dependencies.
 *
 *   MAIL_DIR=/tmp/mail SMTP_SINK_PORT=2525 node scripts/smtp-sink.mjs
 */
import net from "node:net";
import fs from "node:fs";
import path from "node:path";

const dir = process.env.MAIL_DIR || "/tmp/mail";
const port = Number(process.env.SMTP_SINK_PORT || 2525);
fs.mkdirSync(dir, { recursive: true });
let n = 0;

net
  .createServer((sock) => {
    let buf = "";
    let data = false;
    let msg = [];
    const say = (s) => sock.write(s + "\r\n");
    say("220 sink ESMTP");
    sock.on("data", (chunk) => {
      buf += chunk.toString("utf8");
      let i;
      while ((i = buf.indexOf("\r\n")) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 2);
        if (data) {
          if (line === ".") {
            data = false;
            fs.writeFileSync(path.join(dir, `${Date.now()}-${++n}.eml`), msg.join("\r\n"));
            msg = [];
            say("250 OK queued");
          } else msg.push(line.startsWith("..") ? line.slice(1) : line);
          continue;
        }
        const cmd = line.slice(0, 4).toUpperCase();
        if (cmd === "EHLO") sock.write("250-sink\r\n250-AUTH PLAIN\r\n250 8BITMIME\r\n");
        else if (cmd === "HELO") say("250 sink");
        else if (cmd === "AUTH") {
          // "AUTH PLAIN <base64>" in one line, or "AUTH PLAIN" followed by the credentials line.
          if (/^AUTH PLAIN\s*$/i.test(line)) say("334 ");
          else say("235 OK");
        } else if (cmd === "DATA") {
          data = true;
          say("354 go");
        } else if (cmd === "QUIT") {
          say("221 bye");
          sock.end();
        } else if (/^[A-Za-z0-9+/=]{8,}$/.test(line)) {
          say("235 OK"); // credentials line after "AUTH PLAIN"
        } else say("250 OK");
      }
    });
    sock.on("error", () => {});
  })
  .listen(port, "127.0.0.1", () => console.log(`[smtp-sink] listening on ${port}, writing to ${dir}`));
