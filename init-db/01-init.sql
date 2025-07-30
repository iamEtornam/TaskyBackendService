-- Create the databases if they don't exist
SELECT 'CREATE DATABASE tasky_development'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'tasky_development')\gexec

SELECT 'CREATE DATABASE tasky_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'tasky_test')\gexec

SELECT 'CREATE DATABASE tasky_production'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'tasky_production')\gexec

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE tasky_development TO postgres;
GRANT ALL PRIVILEGES ON DATABASE tasky_test TO postgres;
GRANT ALL PRIVILEGES ON DATABASE tasky_production TO postgres;