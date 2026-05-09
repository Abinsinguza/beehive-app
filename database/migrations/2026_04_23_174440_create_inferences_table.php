<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates 'inference_results' — the ML model output table.
 * One record per processed audio file.
 *
 * hive_state unified vocabulary:
 *   normal | pre_swarm | swarm | abscondment | missing_queen |
 *   queenbee_present | pest_infested | external_noise | uncertain
 *
 * The 'inferences' database view in output.sql maps old column names for
 * any legacy code that still uses prediction / inference_latency.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inference_results', function (Blueprint $table) {
            $table->uuid('inference_id')->primary();
            $table->uuid('hive_id');
            $table->uuid('audio_id')->nullable();
            $table->uuid('feature_id')->nullable();
            $table->string('hive_state', 50);
            $table->decimal('confidence_score', 5, 4);
            $table->integer('inference_latency_ms')->nullable();
            $table->timestamp('analyzed_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('hive_id')->references('hive_id')->on('hives')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inference_results');
    }
};
