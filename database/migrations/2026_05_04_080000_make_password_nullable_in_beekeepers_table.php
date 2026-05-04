<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite does not support ALTER COLUMN directly.
        // We recreate the table with password nullable.
        DB::statement('PRAGMA foreign_keys = OFF');

        DB::statement('
            CREATE TABLE beekeepers_new (
                id TEXT NOT NULL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NULL,
                phone TEXT NOT NULL UNIQUE,
                address TEXT NULL,
                password TEXT NULL,
                created_at DATETIME NULL,
                updated_at DATETIME NULL
            )
        ');

        DB::statement('INSERT INTO beekeepers_new SELECT id, name, email, phone, address, password, created_at, updated_at FROM beekeepers');

        DB::statement('DROP TABLE beekeepers');

        DB::statement('ALTER TABLE beekeepers_new RENAME TO beekeepers');

        DB::statement('PRAGMA foreign_keys = ON');
    }

    public function down(): void
    {
        DB::statement('PRAGMA foreign_keys = OFF');

        DB::statement('
            CREATE TABLE beekeepers_new (
                id TEXT NOT NULL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NULL,
                phone TEXT NOT NULL UNIQUE,
                address TEXT NULL,
                password TEXT NOT NULL,
                created_at DATETIME NULL,
                updated_at DATETIME NULL
            )
        ');

        DB::statement('INSERT INTO beekeepers_new SELECT id, name, email, phone, address, COALESCE(password, \'\'), created_at, updated_at FROM beekeepers');

        DB::statement('DROP TABLE beekeepers');

        DB::statement('ALTER TABLE beekeepers_new RENAME TO beekeepers');

        DB::statement('PRAGMA foreign_keys = ON');
    }
};
