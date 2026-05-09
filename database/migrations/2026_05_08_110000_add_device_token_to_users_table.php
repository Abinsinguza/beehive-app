<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds Expo push-notification device token columns to 'users'.
 * Used by the beeswarm React Native mobile app to receive push alerts.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('device_token', 500)->nullable()->after('remember_token');
            $table->timestamp('device_token_updated_at')->nullable()->after('device_token');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['device_token', 'device_token_updated_at']);
        });
    }
};
