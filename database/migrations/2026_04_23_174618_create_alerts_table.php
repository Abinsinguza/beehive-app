<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->string('alert_id')->unique();
            $table->foreignId('inference_id')->constrained('inferences')->onDelete('cascade');
            $table->foreignId('advisory_id')->constrained('advisories')->onDelete('cascade');
            $table->enum('alert_type', ['Info', 'Warning', 'Critical', 'Threat']);
            $table->timestamp('alert_timestamp');
            $table->enum('status', ['pending', 'sent'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
