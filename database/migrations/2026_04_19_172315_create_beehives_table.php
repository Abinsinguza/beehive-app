<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates the unified 'hives' table (was 'beehives' in the old schema).
 * The 'beehives' database view in output.sql preserves backward compatibility.
 * owner_id references users.user_id (farmer role).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hives', function (Blueprint $table) {
            $table->uuid('hive_id')->primary();
            $table->uuid('owner_id');
            $table->string('hive_name', 100)->nullable();
            $table->string('hive_location', 150);
            $table->string('hive_type', 50)->nullable();
            $table->date('installation_date')->nullable();
            $table->string('current_state', 50)->default('unknown');
            $table->decimal('latitude', 9, 6)->nullable();
            $table->decimal('longitude', 9, 6)->nullable();
            $table->timestamps();

            $table->foreign('owner_id')->references('user_id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hives');
    }
};
