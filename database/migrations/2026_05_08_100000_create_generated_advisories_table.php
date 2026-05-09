<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates 'advisories' — per-inference generated advisories.
 * Each record is created by the FastAPI engine when an inference warrants
 * a recommendation.  It references a template from advisory_templates and
 * copies the advisory text at creation time for traceability.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('advisories', function (Blueprint $table) {
            $table->uuid('advisory_id')->primary();
            $table->uuid('inference_id');
            $table->uuid('hive_id');
            $table->unsignedBigInteger('template_id')->nullable();
            $table->string('advisory_type', 30)->default('Reactive');
            $table->string('condition_label', 100)->nullable();
            $table->text('advisory_text')->nullable();
            $table->string('severity', 20)->default('info');
            $table->timestamps();

            $table->foreign('inference_id')->references('inference_id')->on('inference_results')->cascadeOnDelete();
            $table->foreign('hive_id')->references('hive_id')->on('hives')->cascadeOnDelete();
            $table->foreign('template_id')->references('template_id')->on('advisory_templates')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('advisories');
    }
};
