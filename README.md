<br />
<div align="center">
  <a href="https://portabase.io">
    <img src="/public/images/logo.png" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">Portabase</h3>
  <p>
    Free, open-source, and self-hosted solution for automated backup and restoration of your database instances.
  </p>

[![License: Apache](https://img.shields.io/badge/License-apache-yellow.svg)](LICENSE)
[![Docker Pulls](https://img.shields.io/docker/pulls/solucetechnologies/portabase?color=brightgreen)](https://hub.docker.com/r/solucetechnologies/portabase)
[![Platform](https://img.shields.io/badge/platform-linux%20%7C%20macos%20%7C%20windows-lightgrey)](https://github.com/RostislavDugin/postgresus)

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![MariaDB](https://img.shields.io/badge/MariaDB-003545?logo=mariadb&logoColor=white)](https://mariadb.org/)
[![Self Hosted](https://img.shields.io/badge/self--hosted-yes-brightgreen)](https://github.com/RostislavDugin/postgresus)

  <p>
    <strong>
        <a href="https://portabase.io">Documentation</a> •
        <a href="https://www.youtube.com/watch?v=D9uFrGxLc4s">Demo</a> •
        <a href="#installation">Installation</a> •
        <a href="#contributing">Contributing</a> •
        <a href="https://github.com/Soluce-Technologies/portabase/issues/new?labels=bug&template=bug-report---.md">Report Bug</a> •
        <a href="https://github.com/Soluce-Technologies/portabase/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
    </strong>
  </p>

![portabase-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/e3929e58-fefd-44cc-ab26-6f8e1a860c43)

</div>

## 📚 Table of Contents

- [About The Project](#-about-the-project)
- [Getting Started](#-getting-started)
- [Usage](#-usage)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)
- [Acknowledgments](#-acknowledgments)

---

## ✨ About The Project

**Portabase** is a server dashboard tool designed to simplify the backup and restoration of your database instances. It
integrates seamlessly with Portabase agents for managing operations securely and efficiently.

GitHub Repository: [Portabase](https://github.com/Soluce-Technologies/portabase)

### 🔧 Built With

- [![NextJS][NextJS]][NextJS-url] (v16 with App Router)
- [![Drizzle][Drizzle]][Drizzle-url]
- [![ShadcnUI][ShadcnUI]][ShadcnUI-url]
- [![BetterAuth][BetterAuth]][BetterAuth-url]
- [![Docker][Docker]][Docker-url]


---

## 🚀 Getting Started

### Installation

Ensure Docker is installed on your machine before getting started.

### Option 1:  Docker Compose Setup

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
Traefik : [Check this link](https://portabase.io/docs/portabase/advanced-topics/reverse-proxy)

### Option 2:  Locally (Development)

1. Clone the repository:
    ```bash
    git clone https://github.com/Soluce-Technologies/portabase
    cd portabase
    ```
2. Start the development environment:
    ```bash
    docker compose up
    ```

---

## 🛠️ Usage

Portabase provides a web dashboard to manage your database instances and backups.  
It currently supports:

- **PostgreSQL**
- **MySQL**

### Process

1. **Access the dashboard** – Open `http://localhost:8887` in your browser.
2. **Sign up** – Register the first user, who will automatically have the **Admin** role in the default workspace.
3. **Add your first agent** – Follow [this guide](https://github.com/Soluce-Technologies/agent-portabase) for setup
   instructions.
4. **Create organizations and projects** – Link your databases to projects to enable backups and restores.
5. **Configure backup policies** – Define schedules (hourly, daily, weekly, or monthly) and retention rules.
6. **Choose a storage provider** – Select where backups will be stored (local, S3, etc.).
7. **Save and start** – Portabase validates your configuration and starts automated backups based on your defined
   policies.

---

## 🗺️ Roadmap

- [ ] Add changelog
- [ ] Enhance documentation
- [ ] Implement testing procedures
- [ ] Include release file
- [ ] Improve security
- [ ] Enhance UX/UI
- [ ] Improve workspace management system
- [x] Migrate to Drizzle ORM
- [ ] Add multi-language support
- [ ] Extend multi-database support:
    - [x] PostgreSQL
    - [ ] MongoDB
    - [x] MySQL
    - [x] MariaDB

Check out [open issues](https://github.com/Soluce-Technologies/portabase/issues) for more.

---

## 🤝 Contributing

Contributions are welcome and appreciated! Here's how to get started:

1. Fork the repository
2. Create a new branch:
    ```bash
    git checkout -b feature/YourFeature
    ```
3. Commit your changes:
    ```bash
    git commit -m "Add YourFeature"
    ```
4. Push to the branch:
    ```bash
    git push origin feature/YourFeature
    ```
5. Open a pull request

Give the project a ⭐ if you like it!

### Top Contributors

[![Contributors](https://contrib.rocks/image?repo=Soluce-Technologies/portabase)](https://github.com/Soluce-Technologies/portabase/graphs/contributors)

---

## Developer Notes

### Environment Variables

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
that [link](https://portabase.io/docs/portabase/advanced-topics/environment)

### Semantic Versioning

Use the following format for Docker image versioning:

```bash
major.minor.patch-rc.release
# Example: 1.0.0-rc.1

major.minor.patch-rc.release-tag
# Example: 1.0.0-rc.1-dev
```

---

## 📄 License

Distributed under the Apache License. See `LICENSE.txt` for more details.

---

## 📬 Contact

- Killian Larcher - killian.larcher@soluce-technologies.com
- Charles Gauthereau - charles.gauthereau@soluce-technologies.com
- Project Link: [Portabase GitHub](https://github.com/Soluce-Technologies/portabase)

---

## 🙏 Acknowledgments

Thanks to all contributors and the open-source community!

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

