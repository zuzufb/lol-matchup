-- One row per collected ranked game.
create table if not exists matches (
  match_id    text primary key,            -- e.g. EUW1_7123456789
  platform    text not null,               -- euw1, tr1, ...
  patch       text not null,               -- "16.19" (Data Dragon numbering)
  tier        smallint not null,           -- rank of the ladder player we found it through, 0 = Iron .. 9 = Challenger
  game_start  timestamptz not null,
  duration_s  integer not null
);
create index if not exists matches_filter_idx on matches (platform, patch, tier);

-- One row per player in a game, with everything the matchup page needs.
create table if not exists participants (
  match_id        text not null references matches on delete cascade,
  participant_id  smallint not null,
  team_id         smallint not null,
  champion_id     integer not null,
  position        text not null,           -- TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY
  win             boolean not null,
  kills           smallint not null,
  deaths          smallint not null,
  assists         smallint not null,
  cs              smallint not null,
  cs10            smallint,                -- null when the game ended before 10:00
  cs15            smallint,
  gold10          integer,
  gold15          integer,
  first_blood     boolean not null,
  solo_kills      smallint not null,       -- kills on the lane opponent with no assists
  spells          integer[] not null,      -- sorted summoner spell ids
  primary_style   integer not null,
  sub_style       integer not null,
  perks           integer[] not null,      -- 4 primary + 2 secondary rune ids
  shards          integer[] not null,      -- offense, flex, defense
  start_items     integer[] not null,      -- sorted, bought before 1:30
  first_back      integer[] not null,      -- first shopping trip after leaving base
  core_items      integer[] not null,      -- completed items in purchase order
  boots           integer,
  skill_order     text not null,           -- e.g. "QWEQQRQEQEREEWWRWW"
  max_order       text not null,           -- e.g. "QEW"
  purchases       jsonb not null,          -- {"3157": 1234} first purchase second per item
  primary key (match_id, participant_id)
);
create index if not exists participants_champion_idx on participants (champion_id, position);

-- Ladder players we pull match history from.
create table if not exists players (
  puuid         text primary key,
  platform      text not null,
  tier          smallint not null,
  last_checked  timestamptz
);
create index if not exists players_queue_idx on players (platform, last_checked nulls first);

create table if not exists collector_state (
  key    text primary key,
  value  text not null
);

-- Games we fetched but did not keep (remakes, missing roles), so they are not fetched again.
create table if not exists skipped_matches (
  match_id  text primary key
);
