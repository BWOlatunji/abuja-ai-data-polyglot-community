#!/usr/bin/env node
// Creates the first administrator account: a Supabase Auth user plus the
// matching row in the `admins` table. Run this ONCE per environment,
// locally, directly against your Supabase project - never through the
// deployed website (there is deliberately no public "create admin" page
// or API route, since that would be a standing privilege-escalation risk).
//
// Usage:
//   SUPABASE_SERVICE_ROLE_KEY=... PUBLIC_SUPABASE_URL=... \
//     node scripts/create-first-admin.mjs organiser@example.com "Temporary-Pass-123!" "Organiser Name"
//
// Or rely on a local .env file (loaded automatically if present).
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

function loadDotEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadDotEnv();

const [, , email, password, displayName] = process.argv;
const url = process.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !password || !displayName) {
  console.error('Usage: node scripts/create-first-admin.mjs <email> <password> "<display name>"');
  process.exit(1);
}
if (!url || !serviceRoleKey) {
  console.error("Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (set as env vars, or in a local .env file).");
  process.exit(1);
}
if (password.length < 12) {
  console.error("Use a password of at least 12 characters - this account has full admin access.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (createError) {
  console.error("Failed to create auth user:", createError.message);
  process.exit(1);
}

const { error: adminError } = await supabase.from("admins").insert({
  user_id: created.user.id,
  display_name: displayName,
  role: "admin",
});

if (adminError) {
  console.error("Auth user created, but failed to insert into admins table:", adminError.message);
  console.error(`You can insert it manually: insert into admins (user_id, display_name, role) values ('${created.user.id}', '${displayName}', 'admin');`);
  process.exit(1);
}

console.log(`Admin created: ${email} (user_id: ${created.user.id}). Sign in at /admin/login, then change the password.`);
