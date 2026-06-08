<?php

use Illuminate\Database\Migrations\Migration;

// Two-factor columns are now included in the base users table migration.
return new class extends Migration
{
    public function up(): void {}
    public function down(): void {}
};
