const assert = require("node:assert/strict");
const { once } = require("node:events");
const { test } = require("node:test");
const app = require("../app");

test("Express 5 middleware preserves sanitization and HTTP behavior", async () => {
  app.post("/__test/echo", (req, res) => {
    res.json({ body: req.body, query: req.query });
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const response = await fetch(`${base}/__test/echo?%24where=bad&name=hello`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "hello",
        nested: { $ne: null, safe: "value" },
        html: "<script>alert(1)</script>",
      }),
    });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.deepEqual(data.query, { name: "hello" });
    assert.deepEqual(data.body.nested, { safe: "value" });
    assert.equal(data.body.name, "hello");
    assert.ok(!data.body.html.includes("<script>"));

    const logout = await fetch(`${base}/api/v1/users/logout`);
    assert.equal(logout.status, 200);
    assert.equal((await logout.json()).status, "success");
    assert.match(logout.headers.get("set-cookie"), /jwt=loggedout/);

    const malformed = await fetch(`${base}/__test/echo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    assert.equal(malformed.status, 400);
    const oversized = await fetch(`${base}/__test/echo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "x".repeat(11000) }),
    });
    assert.equal(oversized.status, 413);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
