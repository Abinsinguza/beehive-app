<?php

use App\Http\Controllers\BeehiveController;
use App\Http\Controllers\BeekeeperController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdvisoryController;
use App\Http\Controllers\AlertsController;
use App\Http\Controllers\InferenceController;
use App\Http\Controllers\AudioSourceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SystemConfigController;
use App\Http\Controllers\SystemLogsController;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('analytics', [InferenceController::class, 'index'])->name('analytics');
    Route::post('analytics', [InferenceController::class, 'store'])->name('analytics.store');
    Route::get('system-logs', [SystemLogsController::class, 'index'])->name('system-logs');
    Route::get('alerts', [AlertsController::class, 'index'])->name('alerts.index');
   // Route::inertia('beekeepers', 'beekeepers')->name('beekeepers');
    //Route::inertia('beehives', 'beehives')->name('beehives');
    Route::get('beekeepers/admin-keys', [BeekeeperController::class, 'fetchAdminKeys'])->name('beekeepers.admin-keys');
    Route::resource('beekeepers', BeekeeperController::class);
    Route::patch('beekeepers/{beekeeper}/revoke',   [BeekeeperController::class, 'revoke'])->name('beekeepers.revoke');
    Route::patch('beekeepers/{beekeeper}/restore',  [BeekeeperController::class, 'restore'])->name('beekeepers.restore');
    Route::post('beekeepers/{beekeeper}/hives',     [BeekeeperController::class, 'storeHive'])->name('beekeepers.hives.store');
    Route::post('beekeepers/{beekeeper}/regenerate-api-key', [BeekeeperController::class, 'regenerateApiKey'])->name('beekeepers.regenerate-api-key');
    Route::post('beekeepers/{beekeeper}/assign-token', [BeekeeperController::class, 'assignToken'])->name('beekeepers.assign-token');
    Route::post('api-keys/generate', [BeekeeperController::class, 'generateApiKey'])->name('api-keys.generate');
    Route::resource('beehives', BeehiveController::class);
    Route::post('beehives/{beehive}/recordings-folder', [BeehiveController::class, 'createRecordingsFolder'])->name('beehives.recordings-folder');
    Route::resource('advisories', AdvisoryController::class);
    Route::post('advisory-items', [AdvisoryController::class, 'storeItem'])->name('advisory-items.store');
    Route::patch('advisory-items/{advisoryItem}', [AdvisoryController::class, 'updateItem'])->name('advisory-items.update');
    Route::delete('advisory-items/{advisoryItem}', [AdvisoryController::class, 'destroyItem'])->name('advisory-items.destroy');
    Route::resource('inferences', InferenceController::class)->only(['index', 'store']);
    Route::get('system-config',  [SystemConfigController::class, 'index'])->name('system-config');
    Route::post('system-config/ml', [SystemConfigController::class, 'updateMl'])->name('system-config.ml.update');
    Route::get('system-config/ml', fn () => redirect()->route('system-config'));
    Route::get('audio-recordings', [AudioSourceController::class, 'index'])->name('audio-recordings.index');
    Route::post('audio-recordings', [AudioSourceController::class, 'store'])->name('audio-recordings.store');
    Route::inertia('database-schema', 'database-schema')->name('database-schema');
    Route::inertia('help', 'help')->name('help');
});

require __DIR__.'/settings.php';
