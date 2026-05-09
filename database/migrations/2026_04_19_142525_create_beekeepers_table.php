<?php

use Illuminate\Database\Migrations\Migration;

/**
 * No-op: beekeepers are now stored in the unified 'users' table with
 * role = 'farmer'.  The 'beekeepers' database view (created in output.sql)
 * provides backward compatibility for any raw SQL that still uses that name.
 * See: App\Models\Beekeeper (points to 'users' with a global role scope).
 */
return new class extends Migration
{
    public function up(): void {}

    public function down(): void {}
};
