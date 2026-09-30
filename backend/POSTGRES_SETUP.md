# PostgreSQL Setup

The backend defaults to PostgreSQL at `localhost:5432`, database `recovery_manager`, user `recovery_app`, and port `8081` for the HTTP API.

## Create the application role and database

Use pgAdmin connected to the PostgreSQL server that listens on port `5432`. In the Query Tool, connected to the maintenance database (usually `postgres`), create a dedicated non-superuser login. Replace the password locally; do not commit it:

```sql
CREATE ROLE recovery_app WITH LOGIN PASSWORD 'REPLACE_WITH_A_LOCAL_PASSWORD'
    NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
CREATE DATABASE recovery_manager OWNER recovery_app;
```

If the role already exists, update it instead of creating it again:

```sql
ALTER ROLE recovery_app WITH LOGIN NOSUPERUSER NOBYPASSRLS
    PASSWORD 'REPLACE_WITH_A_LOCAL_PASSWORD';
```

If the database already exists, confirm `recovery_app` owns it and its application tables. The backend needs to own its tables to apply and maintain the RLS policies; it must remain a non-superuser without `BYPASSRLS`, or PostgreSQL can bypass row-level security.

## Start the backend

Set the password in the PowerShell session that starts Spring Boot. `psql` is not required if you use pgAdmin.

```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5432/recovery_manager"
$env:DB_USERNAME = "recovery_app"
$securePassword = Read-Host "PostgreSQL recovery_app password" -AsSecureString
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new("", $securePassword).Password
$env:SERVER_PORT = "8081"
Set-Location "E:\sydon rcm pro\recovery-manager-fork-clean\backend"
& "C:\Program Files\apache-maven-3.9.11-bin\apache-maven-3.9.11\bin\mvn.cmd" spring-boot:run
```

Hibernate creates/updates the tables, then `PostgresRlsInitializer` enables and forces organization policies on every tenant table, including reimbursements. Each API transaction sets the organization context used by those policies.

The previous MySQL database is not modified or migrated. PostgreSQL starts with its own database; re-upload/re-import data you need. Verify startup and tenant isolation before relying on the data.