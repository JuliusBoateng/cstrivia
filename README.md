````md
# CS Trivia
Public repo for https://cstrivia.com

A site centered around computer science crossword puzzles.

<img src="./doc/site-screenshot.png" width="700" />

## Tech Stack
- Backend: Python, Django
- Database: PostgreSQL
- Frontend: TypeScript

## Architecture

A focus of this project is keeping a clear separation between backend data modeling and frontend state interaction.

- Uses Django’s ORM to model and query puzzle data
- Serializes data into simple DTO-like structures for the frontend
- Frontend manages puzzle state, user input, and board rendering without relying on a framework
- Backend handles data integrity and persistence, while the frontend focuses on interaction and rendering

### Why Django?

I chose Django for its ORM, built-in migrations, and server-side rendering, which make it easy to model data and iterate quickly.

Since the project is relatively small, keeping everything in a single repo felt simpler than splitting frontend and backend. Server-side rendering also makes it easy to pass data to the frontend without introducing a separate API layer.

This lets me focus on the core parts of the project: backend validation/modeling and frontend interaction.

I avoided using a frontend framework because the project didn’t require one, and I wanted to focus on core state management and DOM updates.

## Setup

```bash
git clone https://github.com/JuliusBoateng/cstrivia.git
cd cstrivia

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt
````

> Use `python3` instead of `python` if your system does not map `python` to Python 3.

---

## Database Setup (PostgreSQL)

Install and start PostgreSQL:

```bash
brew install postgresql
brew services start postgresql
```

> These commands assume macOS with Homebrew installed.

Enter the Postgres shell (your local setup may vary):

```bash
psql postgres
```

Create the database:

```sql
CREATE DATABASE cstrivia;
\l  -- verify it exists
\q  -- exit shell
```

---

## Environment Setup

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

### Database URL

For most local setups:

```env
DATABASE_URL=postgres://localhost:5432/cstrivia
```

If you configured a user/password:

```env
DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/cstrivia
```

---

## Run Migrations

```bash
python manage.py migrate
```

Load sample puzzle data:

```bash
python manage.py load_puzzle crossword/data/open_source_basics.json
```

---

## Setup Frontend

This project uses **vanilla TypeScript** compiled with `tsc` (no frontend framework).

Build the frontend assets before running the development server:

```bash
npm install
npm run build
```

For development:

```bash
npx tsc --watch
```

---

## Run the Server

```bash
python manage.py runserver
```

Visit: [http://localhost:8000/](http://localhost:8000/)

> Make sure you're using **http**, not https.
> Some browsers (like Chrome) may auto-redirect to https, which will cause errors.
