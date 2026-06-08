<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->uuid('alert_id')->primary();
            $table->uuid('hive_id');
            $table->uuid('inference_id');
            $table->uuid('advisory_id')->nullable();
            $table->string('severity_level', 20);
            $table->text('recommended_action')->nullable();
            $table->string('action_status', 20);
            $table->timestamp('alert_timestamp')->nullable();
            $table->timestamps();

            $table->foreign('hive_id')->references('hive_id')->on('hives')->cascadeOnDelete();
            $table->foreign('inference_id')->references('inference_id')->on('inference_results')->cascadeOnDelete();
            // advisory_id FK added after advisories table is created (see 2026_06_04_000007)
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
