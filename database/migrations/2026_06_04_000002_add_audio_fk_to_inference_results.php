<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inference_results', function (Blueprint $table) {
            $table->foreign('audio_id')->references('audio_id')->on('audio_sources')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('inference_results', function (Blueprint $table) {
            $table->dropForeign(['audio_id']);
        });
    }
};
