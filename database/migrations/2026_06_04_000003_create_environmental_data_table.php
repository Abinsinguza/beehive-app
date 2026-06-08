<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('environmental_data', function (Blueprint $table) {
            $table->uuid('env_record_id')->primary();
            $table->uuid('hive_id');
            $table->decimal('temperature', 5, 2)->nullable();
            $table->decimal('humidity', 5, 2)->nullable();
            $table->decimal('population_k_bees', 6, 2)->nullable();
            $table->decimal('nectar_flow_kg_per_day', 6, 2)->nullable();
            $table->timestamp('recorded_at')->nullable();

            $table->foreign('hive_id')->references('hive_id')->on('hives')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('environmental_data');
    }
};
