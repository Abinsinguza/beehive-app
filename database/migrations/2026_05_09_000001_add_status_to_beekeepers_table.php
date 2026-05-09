<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('PRAGMA foreign_keys = OFF');

        DB::statement('
            CREATE TABLE beekeepers_new (
                id TEXT NOT NULL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NULL,
                phone TEXT NOT NULL UNIQUE,
                address TEXT NULL,
                password TEXT NULL,
                status TEXT NOT NULL DEFAULT \'active\',
                created_at DATETIME NULL,
                updated_at DATETIME NULL
            )
        ');

        DB::statement('INSERT INTO beekeepers_new (id, name, email, phone, address, password, created_at, updated_at)
                       SELECT id, name, email, phone, address, password, created_at, updated_at FROM beekeepers');

        DB::statement('DROP TABLE beekeepers');
        DB::statement('ALTER TABLE beekeepers_new RENAME TO beekeepers');

        DB::statement('PRAGMA foreign_keys = ON');
    }

    public function down(): void
    {
        // status column removal not needed for rollback
    }
};
