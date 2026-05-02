const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

const HOMEY_TOKEN = (process.env.HOMEY_TOKEN || "").trim();
const NEIS_API_KEY = (process.env.NEIS_API_KEY || "").trim();

function sendJson(res, status, data) {
  res.status(status).set("content-type", "application/json; charset=utf-8").send(JSON.stringify(data));
}

function auth(req, res, next) {
  const token = req.header("x-homey-token");
  if (!HOMEY_TOKEN || token !== HOMEY_TOKEN) return sendJson(res, 401, { error: "Unauthorized" });
  next();
}

app.get("/health", auth, (req, res) => {
  sendJson(res, 200, { ok: true, date: new Date().toISOString() });
});

app.get("/school", auth, async (req, res) => {
  const name = req.query.name;
  if (!name) return sendJson(res, 400, { error: "name is required" });
  if (!NEIS_API_KEY) return sendJson(res, 500, { error: "NEIS_API_KEY missing" });

  const neisUrl = new URL("https://open.neis.go.kr/hub/schoolInfo");
  neisUrl.searchParams.set("Type", "json");
  neisUrl.searchParams.set("pIndex", "1");
  neisUrl.searchParams.set("pSize", "20");
  neisUrl.searchParams.set("SCHUL_NM", String(name));
  neisUrl.searchParams.set("KEY", NEIS_API_KEY);

  const r = await fetch(neisUrl.toString());
  const text = await r.text();
  if (!r.ok) return sendJson(res, 502, { error: "Upstream NEIS error", upstreamStatus: r.status, upstreamBodyPreview: text.slice(0, 500) });
  res.status(200).set("content-type", "application/json; charset=utf-8").send(text);
});

app.get("/meal", auth, async (req, res) => {
  const { atpt, school, date } = req.query;
  if (!atpt || !school || !date) return sendJson(res, 400, { error: "atpt, school, date are required" });
  if (!NEIS_API_KEY) return sendJson(res, 500, { error: "NEIS_API_KEY missing" });

  const neisUrl = new URL("https://open.neis.go.kr/hub/mealServiceDietInfo");
  neisUrl.searchParams.set("Type", "json");
  neisUrl.searchParams.set("pIndex", "1");
  neisUrl.searchParams.set("pSize", "100");
  neisUrl.searchParams.set("ATPT_OFCDC_SC_CODE", String(atpt));
  neisUrl.searchParams.set("SD_SCHUL_CODE", String(school));
  neisUrl.searchParams.set("MLSV_YMD", String(date));
  neisUrl.searchParams.set("KEY", NEIS_API_KEY);

  const r = await fetch(neisUrl.toString());
  const text = await r.text();
  if (!r.ok) return sendJson(res, 502, { error: "Upstream NEIS error", upstreamStatus: r.status, upstreamBodyPreview: text.slice(0, 500) });
  res.status(200).set("content-type", "application/json; charset=utf-8").send(text);
});

app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
