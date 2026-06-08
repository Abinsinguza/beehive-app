<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInferenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'hive_id'              => ['sometimes', 'string', 'exists:hives,hive_id'],
            'audio_id'             => ['sometimes', 'nullable', 'string'],
            'hive_state'           => ['sometimes', 'string', 'max:50'],
            'confidence_score'     => ['sometimes', 'numeric', 'min:0', 'max:1'],
            'inference_latency_ms' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'analyzed_at'          => ['sometimes', 'date'],
        ];
    }
}
