<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inference_results', function (Blueprint $table) {
            $table->uuid('inference_id')->primary();
            $table->uuid('hive_id');
            $table->uuid('audio_id')->nullable(); // FK → audio_sources (table created separately)
            $table->string('hive_state', 50);
            $table->decimal('confidence_score', 5, 4);
            $table->decimal('inference_latency_ms', 10, 2)->nullable();
            $table->timestamp('analyzed_at')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->foreign('hive_id')->references('hive_id')->on('hives')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inference_results');
    }
};
