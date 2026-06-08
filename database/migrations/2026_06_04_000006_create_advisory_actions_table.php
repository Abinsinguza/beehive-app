<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('advisory_actions', function (Blueprint $table) {
            $table->uuid('action_id')->primary();
            $table->uuid('advisory_id');
            $table->text('action_description');
            $table->string('priority_level', 20);
            $table->string('status', 20);
            $table->timestamp('created_at')->nullable();

            $table->foreign('advisory_id')->references('advisory_id')->on('advisories')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('advisory_actions');
    }
};
