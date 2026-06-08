<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('farmer_data_sources', function (Blueprint $table) {
            $table->uuid('source_id')->primary();
            $table->uuid('user_id');
            $table->uuid('hive_id')->unique();
            $table->string('source_type', 50);
            $table->text('source_path')->nullable();
            $table->jsonb('connection_config')->nullable();
            $table->timestamp('last_scanned_at')->nullable();
            $table->boolean('is_active');
            $table->timestamp('created_at')->nullable();

            $table->foreign('user_id')->references('user_id')->on('users')->cascadeOnDelete();
            $table->foreign('hive_id')->references('hive_id')->on('hives')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('farmer_data_sources');
    }
};
