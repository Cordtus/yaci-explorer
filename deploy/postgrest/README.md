# PostgREST Deployment

## Setup

1. Create the app:
```bash
cd deploy/postgrest
fly apps create republic-postgrest
```

2. Set the database secret:
```bash
fly secrets set PGRST_DB_URI="postgres://postgres:bOqwmcryOQcdmrO@republic-yaci-pg.flycast:5432/postgres?sslmode=disable" -a republic-postgrest
```

3. Deploy:
```bash
fly deploy -a republic-postgrest
```

## Configuration

- **Database**: Uses Fly Postgres at `republic-yaci-pg.flycast`
- **Schema**: Exposes `api` schema
- **Anonymous Role**: `web_anon` (needs to exist in DB)

## Database Setup Required

Before deploying, ensure your database has:

1. The `api` schema with tables
2. The `web_anon` role with SELECT permissions

```sql
-- Create anonymous role if not exists
CREATE ROLE web_anon NOLOGIN;

-- Grant usage on api schema
GRANT USAGE ON SCHEMA api TO web_anon;

-- Grant select on all tables
GRANT SELECT ON ALL TABLES IN SCHEMA api TO web_anon;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA api TO web_anon;
```

## Verify Deployment

```bash
curl https://republic-postgrest.fly.dev/
```
