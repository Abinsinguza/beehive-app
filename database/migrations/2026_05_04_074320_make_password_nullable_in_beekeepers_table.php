<?php

use Illuminate\Database\Migrations\Migration;

/**
 * No-op: the 'beekeepers' table no longer exists.
 * Farmers are stored in 'users' where password_hash is always set
 * (a random placeholder is assigned if the farmer has no direct login).
 */
return new class extends Migration
{
    public function up(): void {}

    public function down(): void {}
};
