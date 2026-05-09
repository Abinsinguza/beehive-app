<?php

use Illuminate\Database\Migrations\Migration;

/**
 * No-op: two_factor_secret and two_factor_recovery_codes are now included
 * directly in the create_users_table migration (0001_01_01_000000).
 */
return new class extends Migration
{
    public function up(): void {}

    public function down(): void {}
};
