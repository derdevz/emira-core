import { Pool } from 'pg';

const connectionString = process.env.POSTGRES_URL;
const isPostgresEnabled = Boolean(connectionString);

const pool = isPostgresEnabled
  ? new Pool({
      connectionString,
    })
  : null;

const schemaStatements = [
  `create table if not exists emira_players (
    id text primary key,
    username text not null,
    display_name text not null,
    badge text not null,
    taps integer not null,
    balance_neaf bigint not null,
    owned_count integer not null,
    wallet_address text
  )`,
  `create table if not exists emira_listings (
    token_id integer primary key,
    name text not null,
    rarity text not null,
    owner text not null,
    price_xlm numeric not null,
    settlement text not null,
    network text not null,
    requires_freighter boolean not null
  )`,
  `create table if not exists emira_wallet_links (
    player_id text primary key,
    address text not null,
    provider text not null,
    linked_at text not null
  )`,
  `create table if not exists emira_sessions (
    sid text primary key,
    payload jsonb not null
  )`,
  `create table if not exists emira_player_progress (
    player_id text primary key,
    tap_power integer not null,
    passive_income integer not null,
    combo integer not null,
    balance_neaf bigint not null
  )`,
];

let initialized = false;

async function ensureSchema() {
  if (!pool || initialized) return;
  for (const statement of schemaStatements) {
    await pool.query(statement);
  }
  initialized = true;
}

export async function loadPostgresState() {
  if (!pool) return null;
  await ensureSchema();

  const [playersResult, listingsResult, walletLinksResult, sessionsResult, progressResult] = await Promise.all([
    pool.query('select * from emira_players order by username asc'),
    pool.query('select * from emira_listings order by token_id asc'),
    pool.query('select * from emira_wallet_links order by linked_at asc'),
    pool.query('select * from emira_sessions'),
    pool.query('select * from emira_player_progress'),
  ]);

  return {
    players: playersResult.rows.map((row) => ({
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      badge: row.badge,
      taps: Number(row.taps),
      balanceNeaf: Number(row.balance_neaf),
      ownedCount: Number(row.owned_count),
      walletAddress: row.wallet_address,
    })),
    listings: listingsResult.rows.map((row) => ({
      tokenId: Number(row.token_id),
      name: row.name,
      rarity: row.rarity,
      owner: row.owner,
      priceXlm: Number(row.price_xlm),
      settlement: row.settlement,
      network: row.network,
      requiresFreighter: row.requires_freighter,
    })),
    walletLinks: walletLinksResult.rows.map((row) => ({
      playerId: row.player_id,
      address: row.address,
      provider: row.provider,
      linkedAt: row.linked_at,
    })),
    sessions: sessionsResult.rows.map((row) => row.payload),
    playerProgress: progressResult.rows.map((row) => ({
      playerId: row.player_id,
      tapPower: Number(row.tap_power),
      passiveIncome: Number(row.passive_income),
      combo: Number(row.combo),
      balanceNeaf: Number(row.balance_neaf),
    })),
  };
}

export async function savePostgresState(state) {
  if (!pool) return false;
  await ensureSchema();

  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query('delete from emira_players');
    await client.query('delete from emira_listings');
    await client.query('delete from emira_wallet_links');
    await client.query('delete from emira_sessions');
    await client.query('delete from emira_player_progress');

    for (const player of state.players) {
      await client.query(
        `insert into emira_players (id, username, display_name, badge, taps, balance_neaf, owned_count, wallet_address)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [player.id, player.username, player.displayName, player.badge, player.taps, player.balanceNeaf, player.ownedCount, player.walletAddress],
      );
    }

    for (const listing of state.listings) {
      await client.query(
        `insert into emira_listings (token_id, name, rarity, owner, price_xlm, settlement, network, requires_freighter)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [listing.tokenId, listing.name, listing.rarity, listing.owner, listing.priceXlm, listing.settlement, listing.network, listing.requiresFreighter],
      );
    }

    for (const walletLink of state.walletLinks) {
      await client.query(
        `insert into emira_wallet_links (player_id, address, provider, linked_at)
         values ($1,$2,$3,$4)`,
        [walletLink.playerId, walletLink.address, walletLink.provider, walletLink.linkedAt],
      );
    }

    for (const session of state.sessions) {
      await client.query(`insert into emira_sessions (sid, payload) values ($1,$2)`, [session.sid, session]);
    }

    for (const progress of state.playerProgress) {
      await client.query(
        `insert into emira_player_progress (player_id, tap_power, passive_income, combo, balance_neaf)
         values ($1,$2,$3,$4,$5)`,
        [progress.playerId, progress.tapPower, progress.passiveIncome, progress.combo, progress.balanceNeaf],
      );
    }

    await client.query('commit');
    return true;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export function postgresEnabled() {
  return isPostgresEnabled;
}
