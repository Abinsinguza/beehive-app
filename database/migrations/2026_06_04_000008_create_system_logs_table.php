<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_logs', function (Blueprint $table) {
            $table->uuid('log_id')->primary();
            $table->string('level', 20);
            $table->string('event_type', 50);
            $table->text('message');
            $table->jsonb('details')->nullable();
            $table->uuid('hive_id')->nullable();
            $table->uuid('user_id')->nullable();
            $table->uuid('audio_id')->nullable();
            $table->timestamp('created_at')->nullable()->index();

            $table->foreign('hive_id')->references('hive_id')->on('hives')->nullOnDelete();
            $table->foreign('user_id')->references('user_id')->on('users')->nullOnDelete();
            $table->foreign('audio_id')->references('audio_id')->on('audio_sources')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_logs');
    }
};
