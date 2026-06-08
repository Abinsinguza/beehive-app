<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('advisory_templates', function (Blueprint $table) {
            $table->bigIncrements('template_id');
            $table->decimal('prediction_code', 10, 4)->unique();
            $table->string('hive_state', 50)->unique();
            $table->string('condition_label', 100);
            $table->text('advisory_text');
            $table->string('advisory_type', 30);
            $table->string('severity', 20);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('advisory_templates');
    }
};
