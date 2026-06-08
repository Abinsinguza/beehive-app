<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Migrate any existing rows to http_api source type
        DB::table('farmer_data_sources')->update(['source_type' => 'http_api']);

        Schema::table('farmer_data_sources', function (Blueprint $table) {
            // Drop source_path — only http_api is supported; path is meaningless
            $table->dropColumn('source_path');
        });

        // Add check constraint so only http_api is accepted going forward
        DB::statement("ALTER TABLE farmer_data_sources ADD CONSTRAINT chk_source_type CHECK (source_type = 'http_api')");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE farmer_data_sources DROP CONSTRAINT IF EXISTS chk_source_type');

        Schema::table('farmer_data_sources', function (Blueprint $table) {
            $table->text('source_path')->nullable()->after('source_type');
        });
    }
};
