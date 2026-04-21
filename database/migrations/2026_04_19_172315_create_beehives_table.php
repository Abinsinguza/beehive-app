<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('beehives', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->timestamps();
            $table->string('owner_id'); // foreign key to beekeepers
            $table->string('hive_location', 150);
            $table->string('hive_type', 50);
            $table->date('installation_date');
            $table->string('current_state');

            // Foreign key constraint
            $table->foreign('owner_id')->references('id')->on('beekeepers');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('beehives');
    }
};
