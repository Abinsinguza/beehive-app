<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audio_sources', function (Blueprint $table) {
            $table->uuid('audio_id')->primary();
            $table->uuid('hive_id');
            $table->string('source_url', 255);
            $table->string('file_format', 20);
            $table->decimal('duration_seconds', 6, 2)->nullable();
            $table->timestamp('captured_at')->nullable();
            $table->timestamp('ingestion_timestamp')->nullable();
            $table->string('status', 20);
            $table->timestamps();

            $table->foreign('hive_id')->references('hive_id')->on('hives')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audio_sources');
    }
};
