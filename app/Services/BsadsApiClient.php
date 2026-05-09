<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Thin HTTP client wrapping every BSADS FastAPI endpoint.
 *
 * Usage:
 *   app(BsadsApiClient::class)->getHives();
 *   app(BsadsApiClient::class)->withToken($jwt)->createHive([...]);
 */
class BsadsApiClient
{
    private string  $base;
    private int     $timeout;
    private ?string $token = null;

    public function __construct()
    {
        $this->base    = rtrim(config('services.bsads_api.base_url', 'http://localhost:8000'), '/');
        $this->timeout = (int) config('services.bsads_api.timeout', 15);
    }

    /** Return a new instance carrying a JWT Bearer token. */
    public function withToken(string $jwt): static
    {
        $clone = clone $this;
        $clone->token = $jwt;
        return $clone;
    }

    // ── Health ────────────────────────────────────────────────────────────────

    public function health(): array
    {
        return $this->get('/health');
    }

    // ── Auth ──────────────────────────────────────────────────────────────────

    /** POST /auth/login → {access_token, token_type, user} */
    public function login(string $email, string $password): array
    {
        return $this->post('/auth/login', compact('email', 'password'));
    }

    /** POST /auth/register → {access_token, token_type, user} */
    public function register(array $data): array
    {
        return $this->post('/auth/register', $data);
    }

    /** GET /auth/me → current user */
    public function me(): array
    {
        return $this->get('/auth/me');
    }

    /** PUT /auth/me — update own profile (name, phone, address) */
    public function updateMe(array $data): array
    {
        return $this->put('/auth/me', $data);
    }

    /** PUT /auth/password — change own password */
    public function changePassword(string $currentPassword, string $newPassword): array
    {
        return $this->put('/auth/password', [
            'current_password' => $currentPassword,
            'new_password'     => $newPassword,
        ]);
    }

    // ── Users (admin) ─────────────────────────────────────────────────────────

    /** GET /users?role= */
    public function getUsers(string $role = ''): array
    {
        return $this->get('/users', $role ? compact('role') : []);
    }

    /** POST /users */
    public function createUser(array $data): array
    {
        return $this->post('/users', $data);
    }

    /** GET /users/{id} */
    public function getUser(string $userId): array
    {
        return $this->get("/users/{$userId}");
    }

    /** PUT /users/{id} */
    public function updateUser(string $userId, array $data): array
    {
        return $this->put("/users/{$userId}", $data);
    }

    /** DELETE /users/{id} */
    public function deleteUser(string $userId): void
    {
        $this->delete("/users/{$userId}");
    }

    // ── Hives ─────────────────────────────────────────────────────────────────

    /** GET /hives?search= */
    public function getHives(string $search = ''): array
    {
        return $this->get('/hives', $search ? compact('search') : []);
    }

    /** GET /hives/{id} */
    public function getHive(string $hiveId): array
    {
        return $this->get("/hives/{$hiveId}");
    }

    /** POST /hives */
    public function createHive(array $data): array
    {
        return $this->post('/hives', $data);
    }

    /** PUT /hives/{id} */
    public function updateHive(string $hiveId, array $data): array
    {
        return $this->put("/hives/{$hiveId}", $data);
    }

    /** DELETE /hives/{id} */
    public function deleteHive(string $hiveId): void
    {
        $this->delete("/hives/{$hiveId}");
    }

    // ── Inference results ─────────────────────────────────────────────────────

    /** GET /inferences?hive_id=&limit= */
    public function getInferences(string $hiveId = '', int $limit = 50): array
    {
        $query = array_filter(['hive_id' => $hiveId, 'limit' => $limit]);
        return $this->get('/inferences', $query);
    }

    /** GET /inferences/{id} */
    public function getInference(string $inferenceId): array
    {
        return $this->get("/inferences/{$inferenceId}");
    }

    // ── Advisories ────────────────────────────────────────────────────────────

    /** GET /advisories?hive_id=&limit= */
    public function getAdvisories(string $hiveId = '', int $limit = 50): array
    {
        $query = array_filter(['hive_id' => $hiveId, 'limit' => $limit]);
        return $this->get('/advisories', $query);
    }

    /** GET /advisories/{id} */
    public function getAdvisory(string $advisoryId): array
    {
        return $this->get("/advisories/{$advisoryId}");
    }

    // ── Advisory templates ────────────────────────────────────────────────────

    /** GET /advisory-templates */
    public function getAdvisoryTemplates(): array
    {
        return $this->get('/advisory-templates');
    }

    /** POST /advisory-templates */
    public function createAdvisoryTemplate(array $data): array
    {
        return $this->post('/advisory-templates', $data);
    }

    /** PUT /advisory-templates/{id} */
    public function updateAdvisoryTemplate(int $templateId, array $data): array
    {
        return $this->put("/advisory-templates/{$templateId}", $data);
    }

    /** DELETE /advisory-templates/{id} */
    public function deleteAdvisoryTemplate(int $templateId): void
    {
        $this->delete("/advisory-templates/{$templateId}");
    }

    // ── Alerts ────────────────────────────────────────────────────────────────

    /** GET /alerts?hive_id= */
    public function getAlerts(string $hiveId = ''): array
    {
        return $this->get('/alerts', $hiveId ? ['hive_id' => $hiveId] : []);
    }

    /** POST /alerts/{id}/acknowledge */
    public function acknowledgeAlert(string $alertId): array
    {
        return $this->post("/alerts/{$alertId}/acknowledge");
    }

    /** PATCH /alerts/{id}/notify */
    public function notifyAlert(string $alertId): array
    {
        return $this->patch("/alerts/{$alertId}/notify");
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    /** GET /dashboard */
    public function getDashboard(): array
    {
        return $this->get('/dashboard');
    }

    // ── Internal HTTP helpers ─────────────────────────────────────────────────

    private function http(): PendingRequest
    {
        $req = Http::baseUrl($this->base)->timeout($this->timeout)->acceptJson();

        if ($this->token !== null) {
            $req = $req->withToken($this->token);
        }

        return $req;
    }

    private function get(string $path, array $query = []): array
    {
        return $this->decode($this->http()->get($path, $query), 'GET', $path);
    }

    private function post(string $path, array $body = []): array
    {
        return $this->decode($this->http()->post($path, $body), 'POST', $path);
    }

    private function put(string $path, array $body = []): array
    {
        return $this->decode($this->http()->put($path, $body), 'PUT', $path);
    }

    private function patch(string $path, array $body = []): array
    {
        return $this->decode($this->http()->patch($path, $body), 'PATCH', $path);
    }

    private function delete(string $path): array
    {
        return $this->decode($this->http()->delete($path), 'DELETE', $path);
    }

    private function decode(Response $response, string $method, string $path): array
    {
        if ($response->failed()) {
            $status = $response->status();
            $detail = $response->json('detail') ?? $response->body();
            Log::warning("BsadsApiClient: {$method} {$path} → HTTP {$status}: {$detail}");
            throw new RuntimeException("BSADS API error ({$status}): {$detail}");
        }

        return $response->json() ?? [];
    }
}
