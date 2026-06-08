<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInferenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'hive_id'              => ['required', 'string', 'exists:hives,hive_id'],
            'audio_id'             => ['nullable', 'string'],
            'hive_state'           => ['required', 'string', 'max:50'],
            'confidence_score'     => ['required', 'numeric', 'min:0', 'max:1'],
            'inference_latency_ms' => ['nullable', 'numeric', 'min:0'],
            'analyzed_at'          => ['required', 'date'],
        ];
    }
}
