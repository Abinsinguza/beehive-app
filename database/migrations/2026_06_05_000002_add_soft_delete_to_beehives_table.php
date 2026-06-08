<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hives', function (Blueprint $table) {
            $table->boolean('is_deleted')->default(false)->after('longitude');
            $table->timestamp('deleted_at')->nullable()->after('is_deleted');
        });
    }

    public function down(): void
    {
        Schema::table('hives', function (Blueprint $table) {
            $table->dropColumn(['is_deleted', 'deleted_at']);
        });
    }
};
