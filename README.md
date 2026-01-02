<br />
<div align="center">
  <a href="https://portabase.io">
    <img src="/public/images/logo.png" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">Portabase</h3>
  <p>
    Take full control of your databases with Portabase — the self-hosted, open-source platform 
    for automated backup, restoration, and operational management. Powered by the <strong>Portabase Agent</strong>, 
    every database in your infrastructure can be monitored, backed up, and managed in real time, 
    with zero reliance on third-party services.
  </p>
  <p>
    Secure, lightweight, and deployable anywhere — on Docker, Kubernetes, or directly on your servers. 
    Designed for teams, DevOps, and enterprises who demand control, reliability, and automation at scale.
  </p>

[![License: Apache](https://img.shields.io/badge/License-apache-yellow.svg)](LICENSE)
[![Docker Pulls](https://img.shields.io/docker/pulls/solucetechnologies/portabase?color=brightgreen)](https://hub.docker.com/r/solucetechnologies/portabase)
[![Platform](https://img.shields.io/badge/platform-linux%20%7C%20macos%20%7C%20windows-lightgrey)](https://github.com/Portabase/portabase)

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![MariaDB](https://img.shields.io/badge/MariaDB-003545?logo=mariadb&logoColor=white)](https://mariadb.org/)
[![Self Hosted](https://img.shields.io/badge/self--hosted-yes-brightgreen)](https://github.com/Portabase/portabase)
[![Open Source](https://img.shields.io/badge/open%20source-❤️-red)](https://github.com/Portabase/portabase)


  <p>
    <strong>
        <a href="https://portabase.io">Documentation</a> •
        <a href="https://www.youtube.com/watch?v=hvLbX5LN1UE">Demo</a> •
        <a href="#installation">Installation</a> •
        <a href="https://github.com/Portabase/portabase/issues/new?labels=bug&template=bug-report---.md">Report Bug</a> •
        <a href="https://github.com/Portabase/portabase/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
    </strong>
  </p>

![portabase-dashboard](https://github.com/user-attachments/assets/f5ec7204-79c0-43ac-ba17-f2ed682c39d6)


</div>

---

## ✨ About The Project

**Portabase** is a server dashboard tool designed to simplify the backup and restoration of your database instances. It
integrates seamlessly with [Portabase agents](https://github.com/Portabase/agent-portabase) for managing operations
securely and efficiently.

### 🔧 Built With

- [![NextJS][NextJS]][NextJS-url]
- [![Drizzle][Drizzle]][Drizzle-url]
- [![ShadcnUI][ShadcnUI]][ShadcnUI-url]
- [![BetterAuth][BetterAuth]][BetterAuth-url]
- [![Docker][Docker]][Docker-url]

---

## 📦 Features

### 🗄️ Supported databases

- PostgreSQL
- MySQL
- MariaDB

### ⏱️ Scheduled backups

- Cron-based scheduling for full control
- Manual trigger support for on-demand backups

### 💾 Storage backends

- On-premise storage: Backups are stored directly on your VPS or server
- Cloud storage: S3-compatible backends
  supported ([documentation](https://portabase.io/docs/dashboard/advanced/storage/s3))
- Full data ownership: No third-party access — your data stays under your control

### 🔔 Smart notifications

- Multi-channel delivery: Email, Slack, Discord, webhooks
- Real-time alerts: Immediate feedback on success and failure
- Custom alert policies: Database-level notification rules
- Team-ready: Designed for DevOps, on-call, and incident workflows

### 👥 Built for team environments

- Workspaces: Organize databases, notification channels, and storage backends by organization and project
- Access control: Fine-grained, role-based permissions on all resources
- Role management: Member, admin, and owner roles at both system and organization levels

### 🐳 Self-hosted & secure

- Containerized deployment: Docker-based setup for predictable installation and operations
- Privacy by design: All data remains within your own infrastructure
- Open source: Apache 2.0 licensed — fully auditable codebase

### 🤖 Portabase Agent ([details](https://github.com/Portabase/agent-portabase))

- Headless architecture: Runs locally on your infrastructure to manage backups and database operations
- Multi-target support: Single agent can connect to multiple databases across different servers
- Lightweight & efficient: Minimal resource footprint while providing full operational control
- Secure communication: Encrypted channels between agent and central dashboard

---

## 🚀 Getting Started

### Installation

You have 3 ways to install **Portabase**:

- Automated CLI (recommended) - [details](https://portabase.io/docs/cli)
- Docker Compose setup - [details](https://portabase.io/docs/dashboard/setup)
- Kubernetes with Helm (soon)

Ensure Docker is installed on your machine before getting started.

### Docker Compose Setup

Create a `docker-compose.yml` file with the following configuration:

```yaml
name: portabase

services:

  portabase:
    image: solucetechnologies/portabase:latest
    env_file:
      - .env
    ports:
      - '8887:80'
    environment:
      - TZ="Europe/Paris"
    volumes:
      - portabase-private:/app/private
    depends_on:
      db:
        condition: service_healthy
    container_name: portabase-app

  db:
    image: postgres:17-alpine
    ports:
      - "5433:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=<your_database>
      - POSTGRES_USER=<database_user>
      - POSTGRES_PASSWORD=<database_password>
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready -U <database_user> -d <your_database>" ]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
  portabase-private:
```

Then run:

```bash
docker compose up -d
```

If you use reverse proxy like
Traefik : [Check this link](https://portabase.io/docs/dashboard/advanced/reverse-proxy)

#### Environment Variables

```yml
# Environment
NODE_ENV=production

  # Database
DATABASE_URL=postgresql://devuser:changeme@db:5432/devdb?schema=public

  # Project Info
PROJECT_NAME="Portabase"
PROJECT_DESCRIPTION="Portabase is a powerful database manager"
PROJECT_URL=http://app.portabase.io
PROJECT_SECRET=

  # SMTP (Email)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

  # Google OAuth
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_GOOGLE_METHOD=

  # S3/MinIO Configuration
S3_ENDPOINT=http://app.s3.portabase.io
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET_NAME=portabase
S3_PORT=9000
S3_USE_SSL=true

  # Storage Backend: 'local' or 's3'
STORAGE_TYPE=local

  # Retention
RETENTION_CRON="* * * * *"
```

To get more information about env variables, check
that [link](https://portabase.io/docs/dashboard/advanced/environment)

### Locally (Development)

1. Clone the repository:
    ```bash
    git clone https://github.com/Portabase/portabase
    cd portabase
    ```
2. Start the development database for Portabase service:
    ```bash
    docker compose up
    ```

3. Start the Next.js app:
    ```bash
    make up
    ```

---

## 🛠️ Usage

Once the installation process is done, follow the steps to configure your instance.

### Dashboard configuration process

1. **Access the dashboard** – Open `http://localhost:8887` in your browser.
2. **Sign up** – Register the first user, who will automatically have the **Admin** role in the default workspace.
3. **Add your first agent** – Follow [this guide](https://github.com/Portabase/agent-portabase) for setup
   instructions.
4. **Create organizations and projects** – Link your databases to projects to enable backups and restores.
5. **Configure backup policies** – Define schedules (hourly, daily, weekly, or monthly) and retention rules.
6. **Choose a storage provider** – Select where backups will be stored (local, S3, etc.).
7. **Save and start** – Portabase validates your configuration and starts automated backups based on your defined
   policies.

---

## 🤝 Contributing

Contributions are welcome and appreciated! Here's how to get started:

1. Fork the repository
2. Create a new branch:
    ```bash
    git checkout -b features/your-feature
    ```
3. Commit your changes:
    ```bash
    git commit -m "Add YourFeature"
    ```
4. Push to the branch:
    ```bash
    git push origin features/your-feature
    ```
5. Open a pull request

### Top Contributors

[![Contributors](https://contrib.rocks/image?repo=Portabase/portabase)](https://github.com/Portabase/portabase/graphs/contributors)

---

## 📄 License

Distributed under the Apache License. See `LICENSE.txt` for more details.

---

## 🙏 Acknowledgments

Thanks to all contributors and the open-source community!

Give the project a ⭐ if you like it!


[Docker]: https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=fff&style=for-the-badge

[NextJS]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white

[BetterAuth]: https://img.shields.io/badge/Better%20Auth-FFF?logo=betterauth&logoColor=000&style=for-the-badge

[Drizzle]: https://img.shields.io/badge/Drizzle-111?style=for-the-badge&logo=Drizzle&logoColor=c5f74f

[ShadcnUI]: https://img.shields.io/badge/shadcn/ui-000000?style=for-the-badge&logo=shadcn/ui&logoColor=white

[NextJS-url]: https://nextjs.org/

[BetterAuth-url]: https://www.better-auth.com/

[Drizzle-url]: https://orm.drizzle.team/

[ShadcnUI-url]: https://ui.shadcn.com/

[Docker-url]: https://www.docker.com/

