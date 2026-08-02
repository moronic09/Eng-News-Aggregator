import "dotenv/config";
import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function fetchArxiv() {
  const url = "http://export.arxiv.org/api/query?search_query=cat:cs.*&sortBy=submittedDate&sortOrder=descending&max_results=5";
  const res = await fetch(url, { headers: { "User-Agent": "EngNewsBot/1.0" } });
  const xml = await res.text();

  const entries = xml.split("<entry>").slice(1);
  return entries.map((entry) => {
    const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1].trim() || "";
    const link = entry.match(/<link href="([^"]*)" rel="alternate"/)?.[1] || "";
    const date = entry.match(/<published>([^<]*)<\/published>/)?.[1] || "";
    const category = entry.match(/<category term="([^"]*)"/)?.[1] || "";
    return { title, url: link, date, source: "arXiv", stat: category };
  });
}

async function fetchHN() {
  const url = "https://hn.algolia.com/api/v1/search_by_date?tags=story&query=engineering";
  const res = await fetch(url);
  const data = await res.json();
  return data.hits.slice(0, 5).filter((h: any) => h.title).map((h: any) => ({
    title: h.title,
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    date: h.created_at,
    source: "Hacker News",
    stat: `${h.points || 0} points`,
  }));
}

async function fetchDevto() {
  const url = "https://dev.to/api/articles?tag=webdev&per_page=5";
  const res = await fetch(url);
  const data = await res.json();
  return data.map((item: any) => ({
    title: item.title,
    url: item.url,
    date: item.published_at,
    source: "Dev.to",
    stat: `${item.public_reactions_count || 0} reactions`,
  }));
}

async function fetchGithub() {
  const url = "https://api.github.com/search/repositories?q=stars:%3E1000&sort=updated&order=desc&per_page=5";
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  });
  const data = await res.json();
  if (!data.items) {
    console.log("GitHub response had no items. Raw response:", JSON.stringify(data).slice(0, 300));
  }
  return (data.items || []).map((item: any) => ({
    title: item.full_name,
    url: item.html_url,
    date: item.updated_at,
    source: "GitHub",
    stat: `${item.stargazers_count || 0} stars`,
  }));
}

async function main() {
  const all = [
    ...(await fetchArxiv()),
    ...(await fetchHN()),
    ...(await fetchDevto()),
    ...(await fetchGithub()),
  ];

  let saved = 0;
  for (const item of all) {
    try {
      await prisma.item.create({ data: item });
      saved++;
    } catch (e: any) {
      console.log("Failed to save:", item.title, "-", e.message);
    }
  }

  console.log(`Fetched ${all.length} items, saved ${saved} new ones.`);
  await prisma.$disconnect();
}

main();