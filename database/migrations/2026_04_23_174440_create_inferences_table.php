<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inferences', function (Blueprint $table) {
            $table->id();
            $table->string('hive_id');
            $table->foreign('hive_id')->references('id')->on('beehives')->onDelete('cascade');
            $table->enum('prediction', ['Normal', 'Pre-swarm', 'Swarm', 'Abscondment', 'Uncertain']);
            $table->decimal('confidence_score', 5, 2);
            $table->decimal('inference_latency', 8, 2);
            $table->timestamp('analyzed_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inferences');
    }
};
