<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBeehiveRequest;
use App\Http\Requests\UpdateBeehiveRequest;
use App\Models\Beehive;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class BeehiveController extends Controller
{
    public function index()
    {
        $search = request('search', '');

        $beehives = Beehive::with('owner')
            ->when($search, function ($query, $search) {
                $query->where('hive_name', 'like', "%{$search}%")
                      ->orWhere('hive_location', 'like', "%{$search}%")
                      ->orWhere('hive_type', 'like', "%{$search}%");
            })
            ->get();

        return inertia('beehives', [
            'beehives' => $beehives,
            'owners'   => User::whereIn('role', ['farmer', 'farmer_pending'])
                              ->select('user_id', 'full_name')
                              ->get(),
            'search'   => $search,
        ]);
    }

    public function create()
    {
        //
    }

    public function store(StoreBeehiveRequest $request)
    {
        $validated = $request->validate([
            'owner_id'          => ['required', 'string', 'exists:users,user_id'],
            'hive_name'         => ['required', 'string', 'max:100'],
            'hive_location'     => ['required', 'string', 'max:150'],
            'hive_type'         => ['required', 'string', 'max:50'],
            'installation_date' => ['required', 'date'],
            'latitude'          => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'         => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        Beehive::create([
            ...$validated,
            'current_state' => 'unknown',
            'is_deleted'    => false,
        ]);

        return redirect()->back()->with('success', 'Hive added successfully');
    }

    public function show(Beehive $beehive, Request $request)
    {
        $beehive->load('owner');

        $latestEnv = $beehive->environmentalData()->latest('recorded_at')->first();

        $recentInferences = $beehive->inferenceResults()
            ->latest('analyzed_at')
            ->take(10)
            ->get();

        $total = $recentInferences->count();
        $inferenceDistribution = $recentInferences
            ->groupBy('hive_state')
            ->map(fn($group) => $total > 0 ? round($group->count() / $total * 100) : 0)
            ->sortByDesc(fn($v) => $v)
            ->map(fn($pct, $state) => ['state' => $state, 'percentage' => $pct])
            ->values();

        $latestInference = $recentInferences->first();

        $recentAdvisories = \App\Models\AdvisoryAction::where('hive_id', $beehive->hive_id)
            ->latest()
            ->take(3)
            ->get()
            ->map(fn($a) => [
                'condition_label' => $a->action_title,
                'advisory_text'   => $a->action_description,
                'severity'        => $a->priority_level,
                'created_at'      => $a->created_at,
            ]);

        $audioSources = $beehive->audioSources()
            ->with(['inferenceResults' => function ($q) {
                $q->latest('analyzed_at')->limit(1);
            }])
            ->latest('created_at')
            ->paginate(5, ['*'], 'audio_page')
            ->withQueryString()
            ->through(function ($audio) {
                $inference = $audio->inferenceResults->first();
                return [
                    'audio_id'             => $audio->audio_id,
                    'source_url'           => $audio->source_url,
                    'file_format'          => $audio->file_format,
                    'duration_seconds'     => $audio->duration_seconds,
                    'captured_at'          => $audio->captured_at,
                    'created_at'           => $audio->created_at,
                    'status'               => $audio->status,
                    'detected_state'       => $inference?->hive_state,
                    'confidence_score'     => $inference?->confidence_score,
                    'analyzed_at'          => $inference?->analyzed_at,
                    'inference_latency_ms' => $inference?->inference_latency_ms,
                ];
            });

        $dataSource = $beehive->dataSource;
        if ($dataSource) {
            $config = $dataSource->connection_config ?? [];
            if (isset($config['api_key'])) {
                $key = $config['api_key'];
                $config['api_key'] = strlen($key) > 8
                    ? substr($key, 0, 4) . '••••••••' . substr($key, -4)
                    : '••••••••';
            }
            $dataSource->connection_config = $config;
        }

        return inertia('beehive-show', [
            'beehive'               => $beehive,
            'latestEnv'             => $latestEnv,
            'inferenceDistribution' => $inferenceDistribution,
            'latestInference'       => $latestInference,
            'recentAdvisories'      => $recentAdvisories,
            'audioSources'          => $audioSources,
            'dataSource'            => $dataSource,
        ]);
    }

    public function edit()
    {
        //
    }

    public function update(UpdateBeehiveRequest $request, Beehive $beehive)
    {
        $beehive->update($request->validate([
            'owner_id'          => ['required', 'string', 'exists:users,user_id'],
            'hive_name'         => ['nullable', 'string', 'max:100'],
            'hive_location'     => ['required', 'string', 'max:150'],
            'hive_type'         => ['nullable', 'string', 'max:50'],
            'installation_date' => ['required', 'date'],
            'current_state'     => ['required', 'in:active,inactive,migrated,lost'],
            'latitude'          => ['nullable', 'numeric'],
            'longitude'         => ['nullable', 'numeric'],
        ]));

        return redirect()->back()->with('success', 'Hive updated successfully');
    }

    public function destroy(Beehive $beehive)
    {
        $beehive->delete();

        return redirect()->back()->with('success', 'Hive deleted successfully');
    }

    public function createRecordingsFolder(Beehive $beehive)
    {
        $beehive->load('owner');
        $apiKey = $beehive->owner?->api_key;

        if (! $apiKey) {
            return redirect()->back()->with('error', "This hive's owner has no API key configured.");
        }

        try {
            $response = Http::withHeaders(['x-api-key' => $apiKey])
                ->timeout(15)
                ->post(rtrim(config('services.ml_auth.base_url'), '/') . "/recordings/hives/{$beehive->hive_name}");
        } catch (ConnectionException $e) {
            return redirect()->back()->with('error', 'The ML server did not respond in time. It may be down — please try again shortly.');
        }

        if (! $response->successful()) {
            return redirect()->back()->with('error', $response->json('detail.0.msg') ?? 'Failed to create recordings folder.');
        }

        return redirect()->back()->with('success', "Recordings folder created for {$beehive->hive_name}.");
    }
}
