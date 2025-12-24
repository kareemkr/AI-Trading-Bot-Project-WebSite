import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
import os
import sys
from dotenv import load_dotenv

# Add the parent directory to sys.path so we can import 'app'
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import Base
from app.models.user import User
from app.models.wallet import Wallet, Transaction, LedgerEntry
from app.models.bot import Signal, BotTradeRecord, BotLog
from app.models.withdrawal import WithdrawalRequest

# Load .env from the backend directory explicitly
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

# this is the Alembic Config object
config = context.config

# Set the sqlalchemy.url dynamically from .env
db_url = os.getenv("DATABASE_URL")
if not db_url:
    db_url = "postgresql+asyncpg://postgres:Khammed9i@localhost:5433/ai_trading_bot"
config.set_main_option("sqlalchemy.url", str(db_url))

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
