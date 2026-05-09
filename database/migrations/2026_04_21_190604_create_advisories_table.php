<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates 'advisory_templates' — the static lookup table that maps each
 * ML hive_state classification to a human-readable advisory text and severity.
 * 9 rows are pre-seeded in output.sql (one per hive_state vocabulary value).
 *
 * Note: The old 'advisories' table in the previous schema was this lookup concept.
 * In the unified schema, 'advisories' is a separate table for generated records
 * (see the 2026_05_08_100000 migration).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('advisory_templates', function (Blueprint $table) {
            $table->id('template_id');
            $table->integer('prediction_code')->unique();
            $table->string('hive_state', 50)->unique();
            $table->string('condition_label', 100);
            $table->text('advisory_text');
            $table->string('advisory_type', 30)->default('Reactive');
            $table->string('severity', 20)->default('info');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('advisory_templates');
    }
};
